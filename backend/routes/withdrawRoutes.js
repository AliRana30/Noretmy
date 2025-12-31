const express = require('express');
const { handleWithdrawalRequest,approveWithdrawRequest,getAllWithdrawRequests, rejectWithdrawRequest, getUserWithdrawalRequest, setWithdrawalMethod} = require('../controllers/withdrawlController');
const { verifyToken, checkRole, requireAdmin } = require('../middleware/jwt');

const router = express.Router();


router.post('/account',verifyToken, checkRole(["seller"]),setWithdrawalMethod);
router.post('/',verifyToken, checkRole(["seller"]),handleWithdrawalRequest);
router.post('/reject', verifyToken, ...requireAdmin, rejectWithdrawRequest);
router.post('/:requestId/approve', verifyToken, ...requireAdmin, approveWithdrawRequest);
router.get('/', verifyToken, ...requireAdmin, getAllWithdrawRequests);
router.get('/request/user',verifyToken,checkRole(["seller"]),getUserWithdrawalRequest)


module.exports = router;
