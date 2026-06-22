import { z } from 'zod';

export const esquemaConfiguracion = z.object({
  precio_basico: z.union([z.string(), z.number()]).optional(),
  precio_pro: z.union([z.string(), z.number()]).optional(),
  precio_premium: z.union([z.string(), z.number()]).optional(),
  limite_gratis: z.union([z.string(), z.number()]).optional(),
  limite_basico: z.union([z.string(), z.number()]).optional(),
  limite_pro: z.union([z.string(), z.number()]).optional(),
  nombre_gratis: z.string().max(40).optional(),
  nombre_basico: z.string().max(40).optional(),
  nombre_pro: z.string().max(40).optional(),
  nombre_premium: z.string().max(40).optional(),
});

export const esquemaCrearUsuario = z.object({
  email: z.string().email('Correo invalido.'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres.'),
  rol: z.enum(['admin', 'scraper'], { errorMap: () => ({ message: 'Rol invalido.' }) }),
});

export const esquemaJuego = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(80),
  categoria: z.enum(['Loteria', 'Chance', 'Astro', 'Especiales'], { errorMap: () => ({ message: 'Categoria invalida.' }) }),
  tipo: z.string().max(40).optional(),
  dia_sorteo: z.string().max(40).optional(),
  orden: z.union([z.string(), z.number()]).optional(),
  numero_digits: z.union([z.string(), z.number()]).optional(),
  serie_digits: z.union([z.string(), z.number()]).optional(),
  total_fracciones: z.union([z.string(), z.number()]).optional(),
  tiene_fraccion: z.boolean().optional(),
  usa_signo: z.boolean().optional(),
  usa_quinta: z.boolean().optional(),
  activo: z.boolean().optional(),
});

export const esquemaJuegoUpdate = esquemaJuego.partial().extend({
  id: z.string().uuid('Id invalido.'),
});

export const esquemaResultado = z.object({
  loteria: z.string().min(1, 'La loteria es obligatoria.'),
  numero: z.string().min(1, 'El numero es obligatorio.'),
  serie: z.string().max(10).optional().default(''),
  premio: z.string().max(40).optional().default(''),
  fecha: z.string().min(1, 'La fecha del sorteo es obligatoria.'),
  secos: z.array(z.string()).optional().default([]),
  signo: z.string().max(20).optional().default(''),
  quinta: z.string().max(10).optional().default(''),
});

export const esquemaBoleto = z.object({
  loteria: z.string().min(1, 'La loteria es obligatoria.'),
  numero: z.string().min(1, 'El numero es obligatorio.').max(6),
  serie: z.string().max(10).optional().default(''),
  fracciones: z.array(z.number()).optional().default([]),
  fecha_sorteo: z.string().optional().default(''),
  valor_apuesta: z.string().max(20).optional().default(''),
});

export function validar(esquema, datos) {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const primerError = resultado.error.errors[0];
    return { ok: false, error: primerError.message };
  }
  return { ok: true, data: resultado.data };
}