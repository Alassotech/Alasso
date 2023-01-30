function authorizeAdmin(req, res, next) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWTSECRETTOKEN);

      console.log(decoded);
      if (decoded.role === "admin") {
        req.isAdmin = true;
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  }
  

  module.exports = authorizeAdmin;