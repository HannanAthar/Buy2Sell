import express from 'express';
const router = express.Router();

/**
 * RECEIVE WEB VITALS
 * Logs performance metrics from the frontend
 */
router.post('/vitals', (req, res) => {
  const { name, value, rating, id, page, timestamp } = req.body;
  
  // Log to console with a specific prefix for easy filtering/monitoring
  console.log(`📊 [PERF] ${name} | ${rating.toUpperCase()} | ${value}${name === 'CLS' ? '' : 'ms'} | Page: ${page} | ID: ${id}`);
  
  // Optionally: Store in DB for long-term analysis
  // await PerformanceMetric.create({ ... });

  res.status(204).end(); // No content response
});

export default router;
