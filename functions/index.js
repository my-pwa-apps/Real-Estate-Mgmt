const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Securely create a new invoice transaction.
 * By using Cloud Functions, we prevent clients from bypassing logic
 * and creating arbitrary transactions directly in the DB.
 */
exports.createInvoice = onCall(async (request) => {
	// Check if user is authenticated
	if (!request.auth) {
		throw new HttpsError("unauthenticated", "User must be authenticated.");
	}

	// Verify ADMIN or MANAGER role from custom claims setup
	const role = request.auth.token.role || "VIEWER";
	if (role !== "ADMIN" && role !== "MANAGER") {
		throw new HttpsError(
			"permission-denied",
			"Only Admins/Managers can create invoices.",
		);
	}

	const { contractId, amount, description } = request.data;
	if (!contractId || !amount || typeof amount !== "number") {
		throw new HttpsError(
			"invalid-argument",
			"Missing required fields or invalid types.",
		);
	}

	try {
		const db = admin.database();

		// Validate that the contract exists
		const contractSnap = await db.ref(`contracten/${contractId}`).once("value");
		if (!contractSnap.exists()) {
			throw new HttpsError("not-found", "Contract not found.");
		}

		// Generate server-side metadata to guarantee authenticity
		const invoiceData = {
			contractId,
			amount,
			description,
			status: "open",
			createdAt: admin.database.ServerValue.TIMESTAMP,
			createdBy: request.auth.uid, // Hardcoded by server
		};

		// Save strictly via backend logic
		const newInvoiceRef = db.ref("transacties").push();
		await newInvoiceRef.set(invoiceData);

		logger.info(
			`Invoice created for contract ${contractId} by ${request.auth.uid}`,
		);

		return { success: true, id: newInvoiceRef.key };
	} catch (error) {
		logger.error("Error creating invoice", error);
		throw new HttpsError("internal", "Failed to create invoice.");
	}
});
