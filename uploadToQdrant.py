import json
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# Initialize Qdrant client
qdrant_client = QdrantClient("http://localhost:6333")

# Load data from threads.json
with open('/Users/kartik-gupta-ij/Developer/ingester/threads.json', 'r') as file:
    data = json.load(file)

# Initialize the embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Prepare points for Qdrant
points = []
for i, item in enumerate(tqdm(data, desc="Embedding and preparing points")):
    message = item['messages']
    name = item.get('name', 'Unknown')  # Default to 'Unknown' if name is not present
    thread_id = item.get('threadId', i)  # Default to index if threadId is not present
    vector = model.encode(message).tolist()
    points.append(PointStruct(id=i, vector=vector, payload={"message": message, "name": name, "threadId": thread_id}))

# Create collection if it doesn't exist
collection_name = "threads_collection"
if not qdrant_client.collection_exists(collection_name):
    qdrant_client.create_collection(
        collection_name=collection_name,
        vectors_config={"size": 384, "distance": "Cosine"}
    )

# Upload points to Qdrant
qdrant_client.upsert(collection_name=collection_name, points=points)
