// appwrite.js
const { Client, Databases } = Appwrite;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') 
    .setProject('695e5ae6002f054958ba'); 

const databases = new Databases(client);
const DATABASE_ID = "695e5f4900278d64aa73";
const COLLECTION_ID = "posts";