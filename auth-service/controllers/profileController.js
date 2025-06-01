exports.getProfile = (req, res) => {
  res.json({ message: 'Profile data', user: req.user });
};
