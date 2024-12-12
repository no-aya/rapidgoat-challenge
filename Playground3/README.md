# Hasura Actions and Backend Logic

In this section, we will discuss how to implement backend logic using Hasura Actions. Basically, Hasura Actions allow you to define custom business logic that can be invoked via a GraphQL query or mutation. We will use it to solve the prod vs. staging environment challenge.

## **Step 1: Set Up Backend Project**

1. **Open VS Code** and create a new folder for your project.
   - Example folder name: `hasura-validation-backend`.

2. Open a terminal in VS Code and initialize a new Node.js project:
   ```bash
   npm init -y
   ```

3. Install necessary dependencies:
   ```bash
   npm install express body-parser crypto cors
   ```

4. Create an `index.js` file in your project folder:
   ```bash
   touch index.js
   ```

---

## **Step 2: Write the Backend Logic**

1. Open `index.js` in VS Code and paste the following code:
   ```javascript
   const express = require("express");
   const cors = require("cors");
   const crypto = require("crypto");

   const app = express();
   app.use(cors()); // Allow requests from any origin
   app.use(express.json()); // Parse JSON requests

   // Store pending confirmations
   const pendingConfirmations = {};

   // Step 1: Validate and request confirmation
   app.post("/validate-metadata-change", (req, res) => {
     const { operation, table_name, environment } = req.body.input;

     if (environment === "production") {
       const token = crypto.randomBytes(16).toString("hex");
       pendingConfirmations[token] = { operation, table_name, timestamp: Date.now() };

       return res.json({
         success: false,
         message: `Are you sure you want to perform '${operation}' on '${table_name}' in production?`,
         confirmation_token: token,
       });
     }

     res.json({
       success: true,
       message: "Operation validated for staging.",
     });
   });

   // Step 2: Confirm and execute metadata change
   app.post("/confirm-metadata-change", (req, res) => {
     const { confirmation_token } = req.body.input;
     const request = pendingConfirmations[confirmation_token];

     if (!request) {
       return res.status(400).json({ success: false, message: "Invalid or expired token." });
     }

     // Execute metadata operation (example, log operation)
     console.log(`Executing operation: ${request.operation} on ${request.table_name}`);

     delete pendingConfirmations[confirmation_token];

     res.json({
       success: true,
       message: `Operation '${request.operation}' on '${request.table_name}' has been executed.`,
     });
   });

   app.listen(3000, () => {
     console.log("Validation backend running on port 3000");
   });
   ```

---

## **Step 3: Test the Backend Locally**

1. Start the server:
   ```bash
   node index.js
   ```

2. Use **Postman** or **cURL** to test the endpoints:

   - **Validate Metadata Change**:
     ```bash
     curl -X POST http://localhost:3000/validate-metadata-change \
     -H "Content-Type: application/json" \
     -d '{
       "input": {
         "operation": "DELETE",
         "table_name": "patients",
         "environment": "production"
       }
     }'
     ```

   - **Confirm Metadata Change**:
     ```bash
     curl -X POST http://localhost:3000/confirm-metadata-change \
     -H "Content-Type: application/json" \
     -d '{
       "input": {
         "confirmation_token": "<token>"
       }
     }'
     ```

   Replace `<token>` with the `confirmation_token` returned from the first request.

---

## **Step 4: Dockerize Your Backend**

1. Create a `Dockerfile` in the project folder:
   ```dockerfile
   FROM node:14
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   CMD ["node", "index.js"]
   ```

2. Create a `.dockerignore` file to exclude unnecessary files:
   ```plaintext
   node_modules
   npm-debug.log
   ```

3. Build your Docker image:
   ```bash
   docker build -t hasura-validation-backend .
   ```

4. Run the container:
   ```bash
   docker run -p 3000:3000 -d hasura-validation-backend
   ```

5. Verify that the backend is running:
   - Open `http://localhost:3000` in your browser or use the `cURL` commands above.

---

## **Step 5: Integrate with Hasura**

1. Open the Hasura console and navigate to the **Actions** tab.

2. Create a new action for **Validate Metadata Change**:
   - **Action Name**: `validateMetadataChange`
   - **Input Type**:
     ```graphql
     input ValidateMetadataChangeInput {
       operation: String!
       table_name: String!
       environment: String!
     }
     ```
   - **Output Type**:
     ```graphql
     type ValidateMetadataChangeOutput {
       success: Boolean!
       message: String!
       confirmation_token: String
     }
     ```
   - **Webhook Handler**: `http://<your-backend-url>/validate-metadata-change`

3. Create another action for **Confirm Metadata Change**:
   - **Action Name**: `confirmMetadataChange`
   - **Input Type**:
     ```graphql
     input ConfirmMetadataChangeInput {
       confirmation_token: String!
     }
     ```
   - **Output Type**:
     ```graphql
     type ConfirmMetadataChangeOutput {
       success: Boolean!
       message: String!
     }
     ```
   - **Webhook Handler**: `http://<your-backend-url>/confirm-metadata-change`

---

## **Step 6: Deploy the Backend**

You can deploy the backend to any hosting provider. Here’s an example using Docker Compose.

### **1. Create a `docker-compose.yml` File**
```yaml
version: "3.8"
services:
  validation-backend:
    build:
      context: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

### **2. Deploy the Application**
Run the following command:
```bash
docker-compose up -d
```

### **3. Verify Deployment**
- The backend should now be running on `http://localhost:3000`.

---

## **Step 7: Test the Full Workflow**

1. Access the Hasura Console and use the `validateMetadataChange` action:
   - Input:
     ```graphql
     mutation {
       validateMetadataChange(input: {
         operation: "DELETE",
         table_name: "patients",
         environment: "production"
       }) {
         success
         message
         confirmation_token
       }
     }
     ```

2. Use the `confirmMetadataChange` action with the returned token:
   ```graphql
   mutation {
     confirmMetadataChange(input: {
       confirmation_token: "<token>"
     }) {
       success
       message
     }
   }
   ```


