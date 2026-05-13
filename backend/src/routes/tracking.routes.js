const router = require('express').Router();
const { authenticate } = require('../middlewares/authMiddleware');
const {
  listHandler, detailHandler, createHandler, updateHandler,
  updateEventHandler, deleteHandler, vesselPositionHandler, aisStatusHandler,
} = require('../controllers/tracking.controller');

router.use(authenticate);

// Envíos
router.get('/',              listHandler);
router.post('/',             createHandler);
router.get('/:id',           detailHandler);
router.put('/:id',           updateHandler);
router.delete('/:id',        deleteHandler);

// Eventos del ciclo de vida
router.put('/:id/events/:eventCode', updateEventHandler);

// AIS
router.get('/ais/status',         aisStatusHandler);
router.get('/ais/vessel/:mmsi',   vesselPositionHandler);

module.exports = router;
