import { nanoid } from "nanoid";

export const assignRequestId = (req, res, next) => {
    const requestId=nanoid();
    console.log("requestId",requestId);
    req.requestId=requestId;
    res.setHeader("X-Request-Id",requestId);
    next();
};



