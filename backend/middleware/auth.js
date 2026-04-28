const jwt = require('jsonwebtoken');
const StaffUser = require('../models/StaffUser');
const Reporter = require('../models/Reporter');

/**
 * Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded payload to req.user
    req.user = decoded;

    // Optionally fetch fresh user data
    if (decoded.userType === 'staff') {
      const user = await StaffUser.findById(decoded.id).populate('tenantId', 'orgName organizationId isSuspended');
      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User account is inactive or not found.' });
      }
      if (user.tenantId && user.tenantId.isSuspended && user.role !== 'SuperAdmin') {
        return res.status(403).json({ error: 'Your organization account has been suspended.' });
      }
      req.user = { ...decoded, tenantId: user.tenantId._id || user.tenantId };
    } else if (decoded.userType === 'reporter') {
      const reporter = await Reporter.findById(decoded.id);
      if (!reporter || !reporter.isActive) {
        return res.status(401).json({ error: 'Reporter account is inactive or not found.' });
      }
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please login again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

/**
 * Restrict access to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * Ensure user belongs to the requested tenant (or is SuperAdmin)
 */
const tenantGuard = (req, res, next) => {
  if (req.user.role === 'SuperAdmin') return next();

  const requestedTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
  if (requestedTenantId && String(req.user.tenantId) !== String(requestedTenantId)) {
    return res.status(403).json({ error: 'Access denied to this organization\'s data.' });
  }
  next();
};

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // ignore errors, proceed as anonymous
  }
  next();
};

module.exports = { protect, restrictTo, tenantGuard, optionalAuth };
