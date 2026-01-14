const express = require('express');
const { db } = require('../database');
const { verifyToken } = require('./auth');

const router = express.Router();

router.get('/', verifyToken, (req, res) => {
  try {
    const scripts = db.prepare('SELECT * FROM reactive_scripts ORDER BY created_at DESC').all();
    res.json(scripts);
  } catch (err) {
    console.error('Error fetching reactive scripts:', err);
    res.status(500).json({ error: 'Failed to fetch reactive scripts' });
  }
});

router.post('/', verifyToken, (req, res) => {
  const { name, script_flow, language, voice } = req.body;

  try {
    const insert = db.prepare('INSERT INTO reactive_scripts (name, script_flow, language, voice) VALUES (?, ?, ?, ?)');
    const result = insert.run(name, JSON.stringify(script_flow), language || 'en-US', voice || 'aura-asteria-en');
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Error creating reactive script:', err);
    res.status(500).json({ error: 'Failed to create reactive script' });
  }
});

router.get('/:id', verifyToken, (req, res) => {
  try {
    const script = db.prepare('SELECT * FROM reactive_scripts WHERE id = ?').get(req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    res.json(script);
  } catch (err) {
    console.error('Error fetching script:', err);
    res.status(500).json({ error: 'Failed to fetch script' });
  }
});

module.exports = router;
