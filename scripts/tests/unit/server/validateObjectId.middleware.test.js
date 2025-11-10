/**
 * Unit Tests - validateObjectId Middleware
 */

const { validateObjectId } = require('../../../../server/middleware/validateObjectId');
const mongoose = require('mongoose');

describe('ValidateObjectId Middleware - Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() with valid MongoDB ObjectId', () => {
    req.params.id = new mongoose.Types.ObjectId().toString();

    validateObjectId(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 with invalid ObjectId', () => {
    req.params.id = 'invalid-id-123';

    validateObjectId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 with missing id parameter', () => {
    req.params.id = undefined;

    validateObjectId(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle projectId parameter', () => {
    req.params.projectId = new mongoose.Types.ObjectId().toString();

    const middleware = validateObjectId('projectId');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
