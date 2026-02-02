export const notFound = (req, res) => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
};

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.statusCode || 500;
  res.status(status).json({
    ok: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
