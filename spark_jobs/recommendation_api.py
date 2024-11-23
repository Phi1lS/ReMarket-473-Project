from pyspark.sql import SparkSession
from pyspark.sql.functions import col, explode, trim, lower
from pyspark.sql.types import StructType, StructField, StringType, ArrayType, IntegerType, FloatType
from pyspark.sql import Row
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")  # Replace with your Firebase service account key
firebase_admin.initialize_app(cred)
db = firestore.client()

# Initialize Spark Session
spark = SparkSession.builder.appName("Recommendations").getOrCreate()


def fetch_data_from_firestore():
    """Fetch users, purchases, and marketplace items from Firestore."""
    users_ref = db.collection("users")
    marketplace_ref = db.collection("marketplace")
    user_docs = users_ref.stream()
    marketplace_docs = marketplace_ref.stream()

    user_data, purchase_data, marketplace_data = [], [], []

    # Fetch user and purchases data
    for user_doc in user_docs:
        user_id = user_doc.id

        # Fetch friends
        friends_ref = db.collection("users").document(user_id).collection("friends")
        friends_docs = friends_ref.stream()
        friends = [doc.to_dict().get("friendId") for doc in friends_docs]

        user_data.append({"userId": user_id, "friends": friends})

        # Fetch purchases
        purchases_ref = db.collection("users").document(user_id).collection("purchases")
        purchase_docs = purchases_ref.stream()

        for purchase_doc in purchase_docs:
            purchase_dict = purchase_doc.to_dict()
            purchase_data.append({
                "userId": user_id,
                "itemId": purchase_dict.get("itemId", ""),  # Extract the actual itemId field
                "imageUrl": purchase_dict.get("imageUrl", ""),
                "itemName": purchase_dict.get("itemName", ""),
                "likeCount": float(purchase_dict.get("likeCount", 0)),
                "likedBy": purchase_dict.get("likedBy", []),
                "message": purchase_dict.get("message", ""),
                "price": float(purchase_dict.get("price", 0.0)),
                "quantity": int(purchase_dict.get("quantity", 1)),
                "timestamp": purchase_dict.get("timestamp").isoformat() if purchase_dict.get("timestamp") else None,
                "userName": purchase_dict.get("userName", ""),
            })

    # Fetch marketplace data using document names
    for item_doc in marketplace_docs:
        item_dict = item_doc.to_dict()
        marketplace_data.append({
            "id": item_doc.id,  # Use document name as id
            "category": item_dict.get("category", ""),
            "createdAt": item_dict.get("createdAt").isoformat() if item_dict.get("createdAt") else None,
            "description": item_dict.get("description", ""),
            "imageUrl": item_dict.get("imageUrl", ""),
            "price": float(item_dict.get("price", 0.0)),
            "quantity": int(item_dict.get("quantity", 0)),
            "sellerAvatar": item_dict.get("sellerAvatar", ""),
            "sellerId": item_dict.get("sellerId", ""),
            "sellerName": item_dict.get("sellerName", ""),
        })

    user_schema = StructType([
        StructField("userId", StringType(), True),
        StructField("friends", ArrayType(StringType()), True),
    ])

    purchase_schema = StructType([
        StructField("userId", StringType(), True),
        StructField("itemId", StringType(), True),
        StructField("imageUrl", StringType(), True),
        StructField("itemName", StringType(), True),
        StructField("likeCount", FloatType(), True),
        StructField("likedBy", ArrayType(StringType()), True),
        StructField("message", StringType(), True),
        StructField("price", FloatType(), True),
        StructField("quantity", IntegerType(), True),
        StructField("timestamp", StringType(), True),
        StructField("userName", StringType(), True),
    ])

    marketplace_schema = StructType([
        StructField("id", StringType(), True),
        StructField("category", StringType(), True),
        StructField("createdAt", StringType(), True),
        StructField("description", StringType(), True),
        StructField("imageUrl", StringType(), True),
        StructField("price", FloatType(), True),
        StructField("quantity", IntegerType(), True),
        StructField("sellerAvatar", StringType(), True),
        StructField("sellerId", StringType(), True),
        StructField("sellerName", StringType(), True),
    ])

    users_df = spark.createDataFrame([Row(**user) for user in user_data], schema=user_schema)
    purchases_df = spark.createDataFrame([Row(**purchase) for purchase in purchase_data], schema=purchase_schema)
    marketplace_df = spark.createDataFrame([Row(**marketplace) for marketplace in marketplace_data], schema=marketplace_schema)

    return users_df, purchases_df, marketplace_df


def recommend_items_based_on_purchases(user_id, purchases_df, marketplace_df):
    """Recommend items based on the user's purchase history."""
    # Normalize user purchases for matching
    normalized_user_purchases = (
        purchases_df.filter(col("userId") == user_id)
        .select("itemId")
        .rdd.map(lambda row: row.itemId.strip().lower())
        .collect()
    )
    print(f"User Purchases (normalized itemId): {normalized_user_purchases}")

    if not normalized_user_purchases:
        print(f"No purchases found for user {user_id}")
        return []

    # Create normalized column for marketplace `id`
    marketplace_df = marketplace_df.withColumn("normalized_id", lower(trim(col("id"))))

    # Match user purchases with marketplace items
    purchased_items_info = marketplace_df.filter(
        col("normalized_id").isin(normalized_user_purchases)
    )

    # Log a concise summary of matching purchased items
    purchased_count = purchased_items_info.count()
    print(f"Matching Purchased Items Count: {purchased_count}")
    if purchased_count > 0:
        print("Sample Matching Purchased Items:")
        purchased_items_info.select("id", "category", "description").show(5, truncate=False)

    # Extract categories from purchased items
    user_purchase_categories = (
        purchased_items_info.select("category")
        .distinct()
        .rdd.map(lambda row: row.category)
        .collect()
    )
    print(f"User Purchase Categories: {user_purchase_categories}")

    if not user_purchase_categories:
        print(f"No categories found for purchases by user {user_id}")
        return []

    # Recommend items from the same categories that the user has not purchased
    recommended_items = (
        marketplace_df.filter(col("category").isin(user_purchase_categories))
        .filter(~col("normalized_id").isin(normalized_user_purchases))
        .select("*")  # Select all fields to return full details
        .distinct()
        .rdd.map(lambda row: row.asDict())  # Convert rows to dictionaries
        .collect()
    )

    # Include original `id` and other fields from the marketplace
    print(f"Recommended Items Count: {len(recommended_items)}")
    if recommended_items:
        print("Sample Recommended Items:")
        for item in recommended_items[:5]:  # Print a sample of 5 items
            print({k: item[k] for k in ('id', 'category', 'description')})

    return recommended_items


def recommend_items_bought_by_friends(user_id, users_df, purchases_df, marketplace_df):
    """Recommend full marketplace items bought by friends that the user hasn't purchased."""
    # Get the list of friends for the user
    friends_list = (
        users_df.filter(col("userId") == user_id)
        .select(explode(col("friends")).alias("friendId"))
        .rdd.map(lambda row: row.friendId)
        .collect()
    )
    print(f"Friends List: {friends_list}")

    if not friends_list:
        print(f"No friends found for user {user_id}")
        return []

    # Get normalized `itemId` for user's purchases
    user_purchases = (
        purchases_df.filter(col("userId") == user_id)
        .select("itemId")
        .rdd.map(lambda row: row.itemId.strip().lower())  # Normalize for matching
        .collect()
    )
    print(f"User Purchases (normalized itemId): {user_purchases}")

    # Get items purchased by friends
    friends_purchases = (
        purchases_df.filter(col("userId").isin(friends_list))
        .select("itemId")
        .distinct()
        .rdd.map(lambda row: row.itemId.strip().lower())  # Normalize for matching
        .collect()
    )
    print(f"Normalized Purchases by Friends: {friends_purchases}")

    if not friends_purchases:
        print(f"No purchases found for friends of user {user_id}")
        return []

    # Normalize `id` in marketplace_df for matching
    marketplace_df = marketplace_df.withColumn("normalized_id", lower(trim(col("id"))))

    # Filter items bought by friends but not by the user
    filtered_items = marketplace_df.filter(
        (col("normalized_id").isin(friends_purchases)) & (~col("normalized_id").isin(user_purchases))
    ).select("*").distinct()

    # Convert the result to a list of dictionaries
    filtered_items_list = filtered_items.rdd.map(lambda row: row.asDict()).collect()

    # Log concise summary
    print(f"Filtered Items Bought by Friends Count: {len(filtered_items_list)}")
    if filtered_items_list:
        print("Sample Items Bought by Friends (excluding user's purchases):")
        for item in filtered_items_list[:5]:  # Print a sample of 5 items
            print({k: item[k] for k in ('id', 'category', 'description')})

    return filtered_items_list


def write_recommendations_to_firestore(user_id, recommendations, collection_name):
    doc_ref = db.collection(collection_name).document(user_id)
    doc_ref.set({"recommendedItems": recommendations})


def main(user_id=None):
    users_df, purchases_df, marketplace_df = fetch_data_from_firestore()

    if user_id:
        recommendations_by_friends = recommend_items_bought_by_friends(user_id, users_df, purchases_df, marketplace_df)
        recommendations_for_user = recommend_items_based_on_purchases(user_id, purchases_df, marketplace_df)

        write_recommendations_to_firestore(user_id, recommendations_by_friends, "friendsRecommendations")
        write_recommendations_to_firestore(user_id, recommendations_for_user, "userRecommendations")


if __name__ == "__main__":
    import sys
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    main(user_id)