const User = require('../models/User');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.searchPatients = async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) {
      return res.json({ patients: [] });
    }

    const regex = new RegExp(escapeRegex(query), 'i');
    const mongoQuery = {
      role: 'patient',
      $or: [
        { name: regex },
        { email: regex },
        { phone: regex }
      ]
    };

    if (/^[a-f\d]{24}$/i.test(query)) {
      mongoQuery.$or.push({ _id: query });
    }

    const patients = await User.find(mongoQuery)
      .select('name email phone age gender bloodGroup createdAt')
      .limit(12)
      .lean();

    res.json({ patients, query });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
