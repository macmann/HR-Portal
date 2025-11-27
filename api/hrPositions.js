const express = require('express');
const { ObjectId } = require('mongodb');
const { getDatabase, db } = require('../db');

const router = express.Router();

// TODO: Replace with actual authentication middleware when available.
// router.use(requireAuth);

function normalizePosition(position = {}) {
  const stringId = position._id ? position._id.toString() : undefined;
  return {
    _id: stringId,
    id: position.id ?? stringId,
    title: position.title || '',
    department: position.department || '',
    location: position.location || '',
    employmentType: position.employmentType || '',
    isPublished: Boolean(position.isPublished),
    createdAt: position.createdAt || null
  };
}

router.get('/positions', async (req, res) => {
  try {
    const database = getDatabase();
    const positions = await database
      .collection('positions')
      .find({}, {
        projection: {
          title: 1,
          department: 1,
          location: 1,
          employmentType: 1,
          isPublished: 1,
          createdAt: 1,
          id: 1
        }
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(positions.map(normalizePosition));
  } catch (error) {
    console.error('Failed to list positions', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.post('/positions', async (req, res) => {
  try {
    const { body } = req;
    const title = (body.title || '').trim();
    if (!title) {
      return res.status(400).json({ error: 'title_required' });
    }

    const now = new Date();
    const document = {
      id: Date.now(),
      title,
      department: (body.department || '').trim(),
      location: (body.location || '').trim(),
      employmentType: (body.employmentType || '').trim(),
      description: (body.description || '').trim(),
      requirements: (body.requirements || '').trim(),
      isPublished: typeof body.isPublished === 'boolean' ? body.isPublished : false,
      createdAt: now
    };

    const database = getDatabase();
    const result = await database.collection('positions').insertOne(document);
    db.invalidateCache?.();

    return res.status(201).json({ id: result.insertedId });
  } catch (error) {
    console.error('Failed to create position', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.put('/positions/:id', async (req, res) => {
  const { id } = req.params;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    return res.status(400).json({ error: 'invalid_id' });
  }

  try {
    const updates = {};
    const providedTitle = Object.prototype.hasOwnProperty.call(req.body, 'title');
    const providedDepartment = Object.prototype.hasOwnProperty.call(req.body, 'department');
    const providedLocation = Object.prototype.hasOwnProperty.call(req.body, 'location');
    const providedEmploymentType = Object.prototype.hasOwnProperty.call(req.body, 'employmentType');
    const providedDescription = Object.prototype.hasOwnProperty.call(req.body, 'description');
    const providedRequirements = Object.prototype.hasOwnProperty.call(req.body, 'requirements');
    const providedIsPublished = Object.prototype.hasOwnProperty.call(req.body, 'isPublished');

    if (providedTitle) {
      const title = (req.body.title || '').trim();
      if (!title) {
        return res.status(400).json({ error: 'title_required' });
      }
      updates.title = title;
    }
    if (providedDepartment) updates.department = (req.body.department || '').trim();
    if (providedLocation) updates.location = (req.body.location || '').trim();
    if (providedEmploymentType) updates.employmentType = (req.body.employmentType || '').trim();
    if (providedDescription) updates.description = (req.body.description || '').trim();
    if (providedRequirements) updates.requirements = (req.body.requirements || '').trim();
    if (providedIsPublished) updates.isPublished = Boolean(req.body.isPublished);

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'no_fields_to_update' });
    }

    updates.updatedAt = new Date();

    const database = getDatabase();
    const result = await database
      .collection('positions')
      .updateOne({ _id: objectId }, { $set: updates });

    if (!result.matchedCount) {
      return res.status(404).json({ error: 'position_not_found' });
    }

    db.invalidateCache?.();
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update position', error);
    res.status(500).json({ error: 'internal_error' });
  }
});

module.exports = router;
