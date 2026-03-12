import { Router } from 'express';
import User from '../Models/User';
import { auth } from '../Middleware/auth';
import { adminOnly } from '../Middleware/admin';

const router = Router();

router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.patch('/users/:id/promote', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true, select: '-password' }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to promote user' });
  }
});

export default router;
