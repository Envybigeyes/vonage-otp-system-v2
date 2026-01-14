const express = require('express');
const { db } = require('../database');
const { verifyToken } = require('./auth');

const router = express.Router();

router.post('/initiate', verifyToken, async (req, res) => {
  const { phone_number, script_id, language, caller_id, recording_enabled } = req.body;

  try {
    const vonage = req.app.locals.vonage;
    const script = db.prepare('SELECT * FROM scripts WHERE id = ?').get(script_id);

    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    const fromNumber = caller_id || process.env.VONAGE_PHONE_NUMBER;

    vonage.calls.create({
      to: [{ type: 'phone', number: phone_number }],
      from: { type: 'phone', number: fromNumber },
      answer_url: [`${process.env.BASE_URL}/webhooks/answer`],
      answer_method: 'POST',
      event_url: [`${process.env.BASE_URL}/webhooks/event`]
    }, (err, result) => {
      if (err) {
        console.error('Vonage call error:', err);
        return res.status(500).json({ error: err.message || 'Call failed' });
      }

      const insert = db.prepare(`
        INSERT INTO calls (call_uuid, phone_number, language, script_id, recording_enabled, caller_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        result.uuid,
        phone_number,
        language || 'en-US',
        script_id,
        recording_enabled ? 1 : 0,
        fromNumber,
        'ringing'
      );

      res.json({ success: true, call_uuid: result.uuid });
    });
  } catch (err) {
    console.error('Call initiation error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', verifyToken, (req, res) => {
  try {
    const calls = db.prepare(`
      SELECT c.*, s.name as script_name 
      FROM calls c 
      LEFT JOIN scripts s ON c.script_id = s.id 
      ORDER BY c.started_at DESC 
      LIMIT 100
    `).all();
    
    res.json(calls);
  } catch (err) {
    console.error('Error fetching call history:', err);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

router.get('/:call_uuid', verifyToken, (req, res) => {
  try {
    const call = db.prepare('SELECT * FROM calls WHERE call_uuid = ?').get(req.params.call_uuid);
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    const dtmf = db.prepare('SELECT * FROM dtmf_logs WHERE call_uuid = ? ORDER BY timestamp').all(req.params.call_uuid);
    const events = db.prepare('SELECT * FROM call_events WHERE call_uuid = ? ORDER BY timestamp').all(req.params.call_uuid);

    res.json({ call, dtmf, events });
  } catch (err) {
    console.error('Error fetching call details:', err);
    res.status(500).json({ error: 'Failed to fetch call details' });
  }
});

module.exports = router;
