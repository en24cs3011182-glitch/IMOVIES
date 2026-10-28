const showService = require('../services/showService');
const asyncHandler = require('../utils/asyncHandler');
const { pick, catchDuplicate } = require('../utils/controllerHelpers');
const fields = ['movie', 'theatre', 'screenId', 'language', 'startTime', 'endTime'];

const listShows = asyncHandler(async (req, res) => {
  const result = await showService.getShows(req.query);
  res.json({ success: true, data: result });
});

const getShow = asyncHandler(async (req, res) => {
  const show = await showService.getShowById(req.params.id);
  res.json({ success: true, data: show });
});

const createShow = asyncHandler(async (req, res) => {
  try {
    const show = await showService.createShow(pick(req.body, fields));
    res.status(201).json({ success: true, data: show });
  } catch (error) {
    throw catchDuplicate(error);
  }
});

const updateShow = asyncHandler(async (req, res) => {
  const show = await showService.updateShow(req.params.id, pick(req.body, fields));
  res.json({ success: true, data: show });
});

const deleteShow = asyncHandler(async (req, res) => {
  const show = await showService.deleteShow(req.params.id);
  res.json({ success: true, data: show });
});

module.exports = { listShows, getShow, createShow, updateShow, deleteShow };
