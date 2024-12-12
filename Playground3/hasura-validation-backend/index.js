const express = require("express");
   const cors = require("cors");
   const crypto = require("crypto");

   const app = express();
   app.use(cors());
   app.use(express.json()); 

   // Store pending confirmations
   const pendingConfirmations = {};

   // Step 1: Validate and request confirmation
   app.post("/validate-metadata-change", (req, res) => {
     const { operation, table_name, environment } = req.body.input;

    console.log("Environment:", environment);
    console.log("Operation:", operation);
    console.log("Table name:", table_name);


     if (environment === "production") {
       const token = crypto.randomBytes(16).toString("hex");
       pendingConfirmations[token] = { operation, table_name, timestamp: Date.now() };

       console.log("Pending confirmations:", pendingConfirmations);
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