from pyspark.sql import SparkSession
from pyspark.sql.functions import col, explode
from pyspark.sql.types import StructType, StructField, StringType, ArrayType, IntegerType, FloatType, TimestampType
from pyspark.sql import Row
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

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

    user_data = []
    purchase_data = []
    marketplace_data = []

    for user_doc in user_docs:
        user_id = user_doc.id
       
       # Fetch friends subcollection
        friends_ref = db.collection("users").document(user_id).collection("friends")
        friends_docs = friends_ref.stream()
        friends = [doc.to_dict().get("friendId") for doc in friends_docs]
        
        user_data.append({"userId": user_id, "friends": friends})

        purchases_ref = db.collection("users").document(user_id).collection("purchases")
        purchase_docs = purchases_ref.stream()

        for purchase_doc in purchase_docs:
            purchase_dict = purchase_doc.to_dict()
            purchase_data.append({
                "userId": user_id,
                "itemId": purchase_doc.id,
                "imageUrl": purchase_dict.get("imageUrl", ""),
                "itemName": purchase_dict.get("itemName", ""),
                "likeCount": float(purchase_dict.get("likeCount", 0)),  # Convert to float
                "likedBy": purchase_dict.get("likedBy", []),
                "message": purchase_dict.get("message", ""),
                "price": float(purchase_dict.get("price", 0.0)),  # Convert to float
                "quantity": int(purchase_dict.get("quantity", 1)),  # Ensure integer
                "timestamp": purchase_dict.get("timestamp").isoformat() if purchase_dict.get("timestamp") else None,
                "userName": purchase_dict.get("userName", ""),
            })

    for item_doc in marketplace_docs:
        item_dict = item_doc.to_dict()
        marketplace_data.append({
            "itemId": item_doc.id,
            "category": item_dict.get("category", ""),
            "createdAt": item_dict.get("createdAt").isoformat() if item_dict.get("createdAt") else None,
            "description": item_dict.get("description", ""),
            "imageUrl": item_dict.get("imageUrl", ""),
            "price": float(item_dict.get("price", 0.0)),  # Convert to float
            "quantity": int(item_dict.get("quantity", 0)),  # Ensure integer
            "sellerAvatar": item_dict.get("sellerAvatar", ""),
            "sellerId": item_dict.get("sellerId", ""),
            "sellerName": item_dict.get("sellerName", ""),
        })

    # Define schemas
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
        StructField("timestamp", StringType(), True),  # Converted to ISO 8601 string
        StructField("userName", StringType(), True),
    ])

    marketplace_schema = StructType([
        StructField("itemId", StringType(), True),
        StructField("category", StringType(), True),
        StructField("createdAt", StringType(), True),  # Converted to ISO 8601 string
        StructField("description", StringType(), True),
        StructField("imageUrl", StringType(), True),
        StructField("price", FloatType(), True),
        StructField("quantity", IntegerType(), True),
        StructField("sellerAvatar", StringType(), True),
        StructField("sellerId", StringType(), True),
        StructField("sellerName", StringType(), True),
    ])

    # Convert to Spark DataFrames
    users_df = spark.createDataFrame([Row(**user) for user in user_data], schema=user_schema)
    purchases_df = spark.createDataFrame([Row(**purchase) for purchase in purchase_data], schema=purchase_schema)
    marketplace_df = spark.createDataFrame([Row(**marketplace) for marketplace in marketplace_data], schema=marketplace_schema)

    return users_df, purchases_df, marketplace_df

def recommend_items_based_on_purchases(user_id, purchases_df, marketplace_df):
    """Recommend items based on the user's purchase history."""
    # Get items purchased by the user
    user_purchases = (
        purchases_df.filter(col("userId") == user_id)
        .select("itemId")
        .rdd.map(lambda row: row.itemId)
        .collect()
    )

    if not user_purchases:
        print(f"No purchases found for user {user_id}")
        return []

    print(f"User Purchases for user {user_id}: {user_purchases}")

    # Debug: Show marketplace data
    print("Marketplace data:")
    marketplace_df.show(truncate=False)

    # Get categories of items the user purchased
    user_purchase_categories = (
        purchases_df.filter(col("userId") == user_id)
        .join(marketplace_df, "itemId")
        .select("category")
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
        .filter(~col("itemId").isin(user_purchases))  # Exclude already purchased items
        .select("itemId", "description")  # Use 'description' instead of 'itemName'
        .distinct()
        .rdd.map(lambda row: row.description)
        .collect()
    )

    print(f"Recommended Items: {recommended_items}")

    return recommended_items

def recommend_items_bought_by_friends(user_id, users_df, purchases_df):
    """Generate a list of items bought by friends of the given user."""
    # Get the list of friends for the user
    friends_list = (
        users_df.filter(col("userId") == user_id)
        .select(explode(col("friends")).alias("friendId"))
        .rdd.map(lambda row: row.friendId)
        .collect()
    )

    print(f"Friends List for user {user_id}: {friends_list}")

    if not friends_list:
        return []

    # Get purchases by friends
    friends_purchases = (
        purchases_df.filter(col("userId").isin(friends_list))
        .select("itemId", "itemName")
        .distinct()
        .rdd.map(lambda row: row.itemName)
        .collect()
    )

    print(f"Purchases by Friends: {friends_purchases}")

    return list(set(friends_purchases))  # Return unique items

def write_recommendations_to_firestore(user_id, recommendations, collection_name):
    """Write the recommendations to Firestore under a specific user's collection."""
    doc_ref = db.collection(collection_name).document(user_id)
    doc_ref.set({"recommendedItems": recommendations})

def main(user_id=None):
    # Fetch data from Firestore
    users_df, purchases_df, marketplace_df = fetch_data_from_firestore()

    if user_id:
        # "Bought by Friends" recommendations
        recommendations_by_friends = recommend_items_bought_by_friends(user_id, users_df, purchases_df)
        print(f"Bought by Friends for user {user_id}: {recommendations_by_friends}")
        write_recommendations_to_firestore(user_id, recommendations_by_friends, "friendsRecommendations")

        # "Recommended for You" recommendations
        recommendations_for_user = recommend_items_based_on_purchases(user_id, purchases_df, marketplace_df)
        print(f"Recommended for You for user {user_id}: {recommendations_for_user}")
        write_recommendations_to_firestore(user_id, recommendations_for_user, "userRecommendations")
    else:
        # Process all users
        all_users = users_df.select("userId").distinct().rdd.map(lambda row: row.userId).collect()
        for user_id in all_users:
            recommendations_by_friends = recommend_items_bought_by_friends(user_id, users_df, purchases_df)
            print(f"Bought by Friends for user {user_id}: {recommendations_by_friends}")
            write_recommendations_to_firestore(user_id, recommendations_by_friends, "friendsRecommendations")

            recommendations_for_user = recommend_items_based_on_purchases(user_id, purchases_df, marketplace_df)
            print(f"Recommended for You for user {user_id}: {recommendations_for_user}")
            write_recommendations_to_firestore(user_id, recommendations_for_user, "userRecommendations")

if __name__ == "__main__":
    import sys
    user_id = sys.argv[1] if len(sys.argv) > 1 else None
    main(user_id)