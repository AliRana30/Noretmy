const express = require('express');
const { handleWithdrawalRequest,approveWithdrawRequest,getAllWithdrawRequests, getWithdrawRequestDetail, rejectWithdrawRequest, getUserWithdrawalRequest, setWithdrawalMethod} = require('../controllers/withdrawlController');
const { verifyToken, checkRole, requireAdmin } = require('../middleware/jwt');

const router = express.Router();

router.post('/account',verifyToken, checkRole(["seller"]),setWithdrawalMethod);
router.post('/',verifyToken, checkRole(["seller"]),handleWithdrawalRequest);
router.post('/reject', verifyToken, ...requireAdmin, rejectWithdrawRequest);
router.post('/:requestId/approve', verifyToken, ...requireAdmin, approveWithdrawRequest);
router.get('/', verifyToken, ...requireAdmin, getAllWithdrawRequests);
// IMPORTANT: Specific routes must come before parameterized routes
router.get('/request/user',verifyToken,checkRole(["seller"]),getUserWithdrawalRequest);
router.get('/:requestId', verifyToken, ...requireAdmin, getWithdrawRequestDetail)

module.exports = router;
