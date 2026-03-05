const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// ============================================
// CORS (CONFIGURACIÓN LIMPIA Y CORRECTA)
// ============================================

const corsOptions = {
  origin: '*', // luego podemos restringir a tu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// ============================================
// SUPABASE
// ============================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;
let connectionStatus = 'not-initialized';

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  connectionStatus = 'connected';
} else {
  connectionStatus = 'error-config';
}

// ============================================
// STATUS
// ============================================

app.get('/api/status', async (req, res) => {
  try {
    if (connectionStatus === 'error-config') {
      return res.status(500).json({
        status: 'error',
        message: 'Faltan variables SUPABASE_URL y/o SUPABASE_KEY'
      });
    }

    const { error } = await supabase.from('ventas').select('*').limit(1);

    if (error) {
      return res.status(500).json({
        status: 'error',
        message: error.message
      });
    }

    res.json({
      status: 'success',
      message: 'Conectado correctamente a Supabase',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================
// VENTAS
// ============================================

app.get('/api/ventas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('id_venta', { ascending: true });

    if (error) throw error;

    res.json({
      status: 'success',
      total: data?.length || 0,
      data: data || []
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/ventas', async (req, res) => {
  try {
    const { id_cliente, id_auto, fecha_venta, total, id_empleado, anulada } = req.body;

    if (!id_cliente || !id_auto || !fecha_venta || !total || !id_empleado) {
      return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
    }

    const { data, error } = await supabase
      .from('ventas')
      .insert([{ id_cliente, id_auto, fecha_venta, total, id_empleado, anulada }])
      .select();

    if (error) throw error;

    res.status(201).json({
      status: 'success',
      data: data[0]
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.put('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id_cliente, id_auto, fecha_venta, total, id_empleado, anulada } = req.body;

    const { data, error } = await supabase
      .from('ventas')
      .update({ id_cliente, id_auto, fecha_venta, total, id_empleado, anulada })
      .eq('id_venta', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Venta no encontrada' });
    }

    res.json({ status: 'success', data: data[0] });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.delete('/api/ventas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('ventas')
      .delete()
      .eq('id_venta', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Venta no encontrada' });
    }

    res.json({ status: 'success', data: data[0] });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// PAGOS
// ============================================

app.get('/api/pagos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .order('id_pago', { ascending: true });

    if (error) throw error;

    res.json({
      status: 'success',
      total: data?.length || 0,
      data: data || []
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/api/pagos', async (req, res) => {
  try {
    const { id_venta, monto, metodo_pago } = req.body;

    if (!id_venta || !monto || !metodo_pago) {
      return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
    }

    const { data, error } = await supabase
      .from('pagos')
      .insert([{ id_venta, monto, metodo_pago }])
      .select();

    if (error) throw error;

    res.status(201).json({
      status: 'success',
      data: data[0]
    });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.delete('/api/pagos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('pagos')
      .delete()
      .eq('id_pago', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Pago no encontrado' });
    }

    res.json({ status: 'success', data: data[0] });

  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// PUERTO (IMPORTANTE PARA RENDER)
// ============================================

const PORT = process.env.PORT || 3060;

app.listen(PORT, () => {
  console.log(`✅ API ejecutándose en puerto ${PORT}`);
  console.log(`Estado Supabase: ${connectionStatus}`);
});