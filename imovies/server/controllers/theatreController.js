const theatreService = require('../services/theatreService');
const asyncHandler = require('../utils/asyncHandler');
const { pick, catchDuplicate } = require('../utils/controllerHelpers');

function theatrePayload(body) {
  const payload = pick(body, ['name', 'city', 'address']);
  if (Array.isArray(body.screens)) {
    payload.screens = body.screens.map((screen) => ({
      name: screen.name,
      rows: screen.rows.map((row) => pick(row, ['row', 'seatCount', 'type'])),
    }));
  }
  return payload;
}

const listTheatres = asyncHandler(async (req, res) => {
  const result = await theatreService.getTheatres(req.query);
  res.json({ success: true, data: result });
});

const getTheatre = asyncHandler(async (req, res) => {
  const theatre = await theatreService.getTheatreById(req.params.id);
  res.json({ success: true, data: theatre });
});

const createTheatre = asyncHandler(async (req, res) => {
  try {
    const theatre = await theatreService.createTheatre(theatrePayload(req.body));
    res.status(201).json({ success: true, data: theatre });
  } catch (error) {
    throw catchDuplicate(error);
  }
});

const updateTheatre = asyncHandler(async (req, res) => {
  const theatre = await theatreService.updateTheatre(req.params.id, theatrePayload(req.body));
  res.json({ success: true, data: theatre });
});

const deleteTheatre = asyncHandler(async (req, res) => {
  const theatre = await theatreService.deleteTheatre(req.params.id);
  res.json({ success: true, data: theatre });
});

module.exports = { listTheatres, getTheatre, createTheatre, updateTheatre, deleteTheatre };
