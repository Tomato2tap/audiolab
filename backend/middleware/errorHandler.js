class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.timestamp = new Date().toISOString();
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  static badRequest(message = 'Requête invalide') {
    return new ApiError(400, message);
  }
  
  static unauthorized(message = 'Non autorisé') {
    return new ApiError(401, message);
  }
  
  static forbidden(message = 'Accès interdit') {
    return new ApiError(403, message);
  }
  
  static notFound(message = 'Ressource non trouvée') {
    return new ApiError(404, message);
  }
  
  static internalError(message = 'Erreur interne du serveur') {
    return new ApiError(500, message);
  }
}

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  let error = { ...err };
  error.message = err.message;
  
  // Log de l'erreur en développement
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 ERREUR:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  }
  
  // Erreur Mongoose - ObjectId invalide
  if (err.name === 'CastError') {
    const message = `Ressource non trouvée avec l'ID: ${err.value}`;
    error = ApiError.notFound(message);
  }
  
  // Erreur Mongoose - Duplicata de clé
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `La valeur '${value}' existe déjà pour le champ '${field}'. Veuillez en choisir une autre.`;
    error = ApiError.badRequest(message);
  }
  
  // Erreur Mongoose - Validation
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Données d'entrée invalides: ${errors.join('. ')}`;
    error = ApiError.badRequest(message);
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token JWT invalide';
    error = ApiError.unauthorized(message);
  }
  
  // Erreur JWT expiré
  if (err.name === 'TokenExpiredError') {
    const message = 'Token JWT expiré';
    error = ApiError.unauthorized(message);
  }
  
  // Réponse finale
  res.status(error.statusCode || 500).json({
    success: false,
    status: error.status,
    message: error.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error,
      timestamp: new Date().toISOString()
    })
  });
};

module.exports = { ApiError, errorHandler };