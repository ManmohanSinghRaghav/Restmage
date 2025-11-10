const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        message: `Invalid ${paramName} format. Expected a valid MongoDB ObjectId.` 
      });
    }
    
    next();
  };
};

module.exports = { validateObjectId };
