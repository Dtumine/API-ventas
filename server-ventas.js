const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let connectionStatus = 'not-initialized';

// Inicializar Supabase
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  connectionStatus = 'connected';
} else {
  connectionStatus = 'error-config';
}

// ============================================
// RUTAS DE ESTADO
// ============================================

app.get('/api/status', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({
        status: 'error',
        message: 'Configuración de Supabase incompleta',
        details: 'Faltan variables de entorno: SUPABASE_URL y/o SUPABASE_KEY'
      });
    }

    const { data, error } = await supabase.from('ventas').select('*').limit(1);
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al conectar con Supabase',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      message: 'Conexión exitosa con Supabase (Tablas ventas y pagos)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// ============================================
// RUTAS DE VENTAS (GET, POST, PUT, DELETE)
// ============================================

// Obtener todas las ventas
app.get('/api/ventas', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({ status: 'error', message: 'Configuración incompleta' });
    }

    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('id_venta', { ascending: true });
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener ventas',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      total: data ? data.length : 0,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Obtener una venta por ID
app.get('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .eq('id_venta', id)
      .single();
    
    if (error) {
      return res.status(404).json({
        status: 'error',
        message: 'Venta no encontrada',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Crear una venta
app.post('/api/ventas', async (req, res) => {
  try {
    const { id_cliente, id_auto, fecha_venta, precio, id_empleado } = req.body;

    if (!id_cliente || !id_auto || !fecha_venta || !precio || !id_empleado) {
      return res.status(400).json({
        status: 'error',
        message: 'Faltan campos obligatorios: id_cliente, id_auto, fecha_venta, precio, id_empleado'
      });
    }

    const { data, error } = await supabase
      .from('ventas')
      .insert([
        {
          id_cliente,
          id_auto,
          fecha_venta,
          precio,
          id_empleado
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al crear venta',
        details: error.message
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Venta creada exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Actualizar una venta
app.put('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_cliente, id_auto, fecha_venta, precio, id_empleado } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('ventas')
      .update({
        id_cliente,
        id_auto,
        fecha_venta,
        precio,
        id_empleado
      })
      .eq('id_venta', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar venta',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Venta no encontrada'
      });
    }

    res.json({
      status: 'success',
      message: 'Venta actualizada exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Eliminar una venta
app.delete('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('ventas')
      .delete()
      .eq('id_venta', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al eliminar venta',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Venta no encontrada'
      });
    }

    res.json({
      status: 'success',
      message: 'Venta eliminada exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// ============================================
// RUTAS DE PAGOS (GET, POST, PUT, DELETE)
// ============================================

// Obtener todos los pagos
app.get('/api/pagos', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({ status: 'error', message: 'Configuración incompleta' });
    }

    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .order('id_pago', { ascending: true });
    
    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al obtener pagos',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      total: data ? data.length : 0,
      data: data || []
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Obtener un pago por ID
app.get('/api/pagos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('id_pago', id)
      .single();
    
    if (error) {
      return res.status(404).json({
        status: 'error',
        message: 'Pago no encontrado',
        details: error.message
      });
    }

    res.json({
      status: 'success',
      data: data
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Crear un pago
app.post('/api/pagos', async (req, res) => {
  try {
    const { id_venta, monto, metodo_pago } = req.body;

    if (!id_venta || !monto || !metodo_pago) {
      return res.status(400).json({
        status: 'error',
        message: 'Faltan campos obligatorios: id_venta, monto, metodo_pago'
      });
    }

    const { data, error } = await supabase
      .from('pagos')
      .insert([
        {
          id_venta,
          monto,
          metodo_pago,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al crear pago',
        details: error.message
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Pago creado exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Actualizar un pago
app.put('/api/pagos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_venta, monto, metodo_pago } = req.body;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('pagos')
      .update({
        id_venta,
        monto,
        metodo_pago
      })
      .eq('id_pago', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al actualizar pago',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Pago no encontrado'
      });
    }

    res.json({
      status: 'success',
      message: 'Pago actualizado exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// Eliminar un pago
app.delete('/api/pagos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'error',
        message: 'El parámetro id es requerido'
      });
    }

    const { data, error } = await supabase
      .from('pagos')
      .delete()
      .eq('id_pago', id)
      .select();

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error al eliminar pago',
        details: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Pago no encontrado'
      });
    }

    res.json({
      status: 'success',
      message: 'Pago eliminado exitosamente',
      data: data[0]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error en el servidor',
      details: error.message
    });
  }
});

// ============================================
// MANEJO DE ERRORES Y PUERTO
// ============================================

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    details: err.message
  });
});

const PORT = process.env.PORT_VENTAS || 3060;
app.listen(PORT, () => {
  console.log(`✅ API Ventas/Pagos ejecutándose en http://localhost:${PORT}`);
  console.log(`Estado de conexión: ${connectionStatus}`);
});
