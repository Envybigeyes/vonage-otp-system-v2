const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');
const { verifyToken } = require('./auth');

const router = express.Router();

router.post('/initiate-advanced', verifyToken, async (req, res) => {
  const { phone_number, language, script_flow, voice, caller_id, recording_enabled } = req.body;

  try {
    const vonage = req.app.locals.vonage;
    
    console.log('🔍 Vonage object exists:', !!vonage);
    console.log('🔍 Making call to:', phone_number);
    console.log('🔍 From number:', process.env.VONAGE_PHONE_NUMBER);
    console.log('🔍 Application ID:', process.env.VONAGE_APPLICATION_ID);
    
    const tempCallUuid = uuidv4();

    const callStateData = {
      currentStep: 0,
      scriptFlow: script_flow,
      dtmfBuffer: '',
      phoneNumber: phone_number,
      language: language || 'en-US',
      voice: voice || 'Joey',
      recording: recording_enabled || false,
      useDeepgram: false
    };

    const fromNumber = caller_id || process.env.VONAGE_PHONE_NUMBER;

    const callPayload = {
      to: [{ type: 'phone', number: phone_number }],
      from: { type: 'phone', number: fromNumber },
      answer_url: [`${process.env.BASE_URL}/api/advanced-calls/answer`],
      answer_method: 'POST',
      event_url: [`${process.env.BASE_URL}/webhooks/event`]
    };
    
    console.log('📤 Call payload:', JSON.stringify(callPayload, null, 2));

    vonage.calls.create(callPayload, (err, result) => {
      if (err) {
        console.error('❌ Vonage call error:', JSON.stringify(err, null, 2));
        return res.status(500).json({ error: err.body || err.message || 'Call failed' });
      }

      console.log('✅ Call created successfully:', result.uuid);

      const insert = db.prepare(`
        INSERT INTO calls (call_uuid, phone_number, language, custom_script, recording_enabled, caller_id, voice_model, status, call_state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        result.uuid,
        phone_number,
        language,
        JSON.stringify(script_flow),
        recording_enabled ? 1 : 0,
        fromNumber,
        voice || 'Joey',
        'ringing',
        JSON.stringify(callStateData)
      );

      res.json({ success: true, call_uuid: result.uuid });
    });
  } catch (err) {
    console.error('💥 Caught error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/answer', async (req, res) => {
  const call_uuid = req.body.uuid || req.query.uuid || req.body.conversation_uuid;
  
  console.log('📞 Answer webhook called');
  console.log('📞 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📞 Call UUID:', call_uuid);
  
  const callRow = db.prepare('SELECT call_state FROM calls WHERE call_uuid = ?').get(call_uuid);
  
  if (!callRow || !callRow.call_state) {
    console.log('⚠️ No call state found for:', call_uuid);
    return res.json([{ action: 'talk', text: 'Call state not found.', voiceName: 'Joey' }]);
  }

  const state = JSON.parse(callRow.call_state);
  const step = state.scriptFlow.steps[state.currentStep];
  const voiceName = state.language === 'es-ES' ? 'Lucia' : 'Joey';

  const ncco = [
    {
      action: 'talk',
      text: step.message,
      voiceName: voiceName,
      language: state.language
    },
    {
      action: 'input',
      eventUrl: [`${process.env.BASE_URL}/api/advanced-calls/dtmf-handler/${call_uuid}`],
      dtmf: {
        maxDigits: step.expectedDigits || 1,
        timeOut: step.timeout || 30
      }
    }
  ];

  console.log('📤 Sending NCCO:', JSON.stringify(ncco, null, 2));
  res.json(ncco);
});

router.post('/dtmf-handler/:call_uuid', async (req, res) => {
  const { call_uuid } = req.params;
  const { dtmf } = req.body;
  
  console.log('📟 DTMF received for', call_uuid, ':', dtmf);
  
  const callRow = db.prepare('SELECT call_state FROM calls WHERE call_uuid = ?').get(call_uuid);
  
  if (!callRow || !callRow.call_state) {
    return res.json([{ action: 'talk', text: 'Session expired.', voiceName: 'Joey' }]);
  }

  const state = JSON.parse(callRow.call_state);

  db.prepare('INSERT INTO dtmf_logs (call_uuid, digit, timestamp) VALUES (?, ?, ?)').run(call_uuid, dtmf, new Date().toISOString());

  if (global.wss) {
    global.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'dtmf',
          data: { call_uuid, dtmf, timestamp: new Date().toISOString() }
        }));
      }
    });
  }

  state.dtmfBuffer += dtmf;
  const currentStep = state.scriptFlow.steps[state.currentStep];
  const voiceName = state.language === 'es-ES' ? 'Lucia' : 'Joey';

  if (state.dtmfBuffer.length >= (currentStep.expectedDigits || 1)) {
    state.dtmfBuffer = '';
    state.currentStep++;

    if (state.currentStep >= state.scriptFlow.steps.length) {
      db.prepare('UPDATE calls SET call_state = NULL WHERE call_uuid = ?').run(call_uuid);
      return res.json([
        { action: 'talk', text: state.scriptFlow.finalMessage || 'Thank you. Goodbye.', voiceName: voiceName }
      ]);
    }

    const nextStep = state.scriptFlow.steps[state.currentStep];
    
    db.prepare('UPDATE calls SET call_state = ? WHERE call_uuid = ?').run(JSON.stringify(state), call_uuid);
    
    return res.json([
      { action: 'talk', text: nextStep.message, voiceName: voiceName },
      {
        action: 'input',
        eventUrl: [`${process.env.BASE_URL}/api/advanced-calls/dtmf-handler/${call_uuid}`],
        dtmf: { maxDigits: nextStep.expectedDigits || 1, timeOut: nextStep.timeout || 30 }
      }
    ]);
  }

  db.prepare('UPDATE calls SET call_state = ? WHERE call_uuid = ?').run(JSON.stringify(state), call_uuid);

  res.json([]);
});

module.exports = router;
