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
  categoria: z.enum(['Loteria', 'Chance', 'Especiales'], { errorMap: () => ({ message: 'Categoria invalida.' }) }),
  tipo: z.string().max(40).optional(),
  dia_sorteo: z.string().max(60).optional(),
  horario: z.string().max(60).optional(),
  operador: z.string().max(80).optional(),
  canal_en_vivo: z.string().max(120).optional(),
  descripcion: z.string().max(200).optional().default(''),
  orden: z.union([z.string(), z.number()]).optional(),
  numero_digits: z.union([z.string(), z.number()]).optional(),
  serie_digits: z.union([z.string(), z.number()]).optional(),
  total_fracciones: z.union([z.string(), z.number()]).optional(),
  tiene_fraccion: z.boolean().optional(),
  usa_signo: z.boolean().optional(),
  usa_quinta: z.boolean().optional(),
  activo: z.boolean().optional(),
  plan_premios: z.array(z.object({
    nombre: z.string().min(1, 'El nombre del premio es obligatorio.').max(60),
    posicion: z.union([z.string(), z.number()]).optional(),
    tipo: z.enum(['mayor', 'seco', 'aproximacion', 'especial']).optional().default('seco'),
    cifras: z.union([z.string(), z.number()]).optional(),
    cantidad_ganadores: z.union([z.string(), z.number()]).optional().default(1),
    premio: z.string().max(60).optional().default(''),
    descripcion: z.string().max(120).optional().default(''),
    requiere_serie: z.boolean().optional().default(false),
    comparar_serie: z.boolean().optional().default(false),
  })).optional(),
});

export const esquemaJuegoUpdate = esquemaJuego.partial().extend({
  id: z.string().uuid('Id invalido.'),
});

// Ganador individual dentro de un tier de premio
const esquemaGanadorPremio = z.object({
  numero: z.string().min(1, 'El numero ganador es obligatorio.'),
  serie: z.string().max(10).optional().default(''),
  premio: z.string().max(40).optional().default(''),
});

// Tier de premio con sus ganadores
const esquemaTierPremio = z.object({
  tier_nombre: z.string().min(1, 'El nombre del tier es obligatorio.'),
  tier_posicion: z.union([z.string(), z.number()]).optional().default(1),
  tipo: z.enum(['mayor', 'seco', 'aproximacion', 'especial']).optional().default('seco'),
  cifras: z.union([z.string(), z.number()]).optional().default(0),
  ganadores: z.array(esquemaGanadorPremio).optional().default([]),
});

export const esquemaResultado = z.object({
  loteria: z.string().min(1, 'La loteria es obligatoria.'),
  numero: z.string().min(1, 'El numero es obligatorio.'),
  serie: z.string().max(10).optional().default(''),
  premio: z.string().max(40).optional().default(''),
  fecha: z.string().min(1, 'La fecha del sorteo es obligatoria.'),
  // Legacy: secos como array plano (backwards compat)
  secos: z.array(z.string()).optional().default([]),
  // Nuevo: premios estructurados por tier
  premios: z.array(esquemaTierPremio).optional().default([]),
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