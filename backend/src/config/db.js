import mongoose from "mongoose";

export async function connectDb() {
  // #region agent log
  fetch("http://127.0.0.1:7939/ingest/a68c5c44-a7bc-4798-8f88-4b0ca584305d",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"73de6c"},body:JSON.stringify({sessionId:"73de6c",runId:"startup-debug",hypothesisId:"H2",location:"db.js:connectDbEntry",message:"Entered connectDb",data:{mongooseReadyState:mongoose.connection.readyState},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  if (!process.env.MONGODB_URI) {
    // #region agent log
    fetch("http://127.0.0.1:7939/ingest/a68c5c44-a7bc-4798-8f88-4b0ca584305d",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"73de6c"},body:JSON.stringify({sessionId:"73de6c",runId:"startup-debug",hypothesisId:"H2",location:"db.js:missingMongoUri",message:"MONGODB_URI missing before connect",data:{},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw new Error("Missing MONGODB_URI");
  }

  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    // #region agent log
    fetch("http://127.0.0.1:7939/ingest/a68c5c44-a7bc-4798-8f88-4b0ca584305d",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"73de6c"},body:JSON.stringify({sessionId:"73de6c",runId:"startup-debug",hypothesisId:"H1",location:"db.js:connectSuccess",message:"Mongoose connect succeeded",data:{mongooseReadyState:mongoose.connection.readyState},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  } catch (err) {
    // #region agent log
    fetch("http://127.0.0.1:7939/ingest/a68c5c44-a7bc-4798-8f88-4b0ca584305d",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"73de6c"},body:JSON.stringify({sessionId:"73de6c",runId:"startup-debug",hypothesisId:"H1",location:"db.js:connectError",message:"Mongoose connect failed",data:{name:err?.name,message:err?.message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    throw err;
  }
}

