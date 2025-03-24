class ApiResponse{
    constructor(statusCode,data,message="Success",requestId){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
        this.requestId=requestId
    }
    static success(res,statusCode, message, data = [], requestId = null) {
        return res.status(statusCode).json(new ApiResponse(statusCode, data, message, requestId));
      }
}

export {ApiResponse}