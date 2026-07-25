import jwt from 'jsonwebtoken';

export const protectRoute = async (req, res, next) => {
  let token;

  // Read token from the incoming authorization header standard
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decrypt the token payload using the environment variable string
      const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);

      // Extract the id context and attach it directly to the request object
      req.user = { id: decodedPayload.id };
      
      return next(); // Pass execution cleanly down the track to the controller
    } catch (error) {
      console.error("Token verification security failure:", error);
      return res.status(401).json({ message: "Not authorized: Token encryption invalid or expired." });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized: No security bearer token discovered in headers." });
  }
};