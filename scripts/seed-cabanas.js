// scripts/seed-cabanas.js
// Este script contiene datos de ejemplo para la colección 'cabanas' en Firestore
// 
// Campos de la colección cabanas:
// - nombre (string): Nombre de la cabaña
// - arrendatario (string): Nombre del arrendatario/responsable
// - detalles (string): Descripción detallada de la cabaña
// - periodo (string): "diario" o "mensual"
// - estado (string): "disponible", "mantenimiento", "fuera_servicio"
// - fechaContrato (Date): Fecha del contrato de arriendo
// - valor (number): Valor en pesos chilenos
// - imagenes (string[]): Array de nombres de archivos de imágenes
//
// Para usar estos datos en la aplicación, usar el botón "Agregar Datos Ejemplo" 
// en la página /cabanas o ejecutar la función agregarDatosEjemplo()

const cabanasSample = [
  {
    nombre: "Regional Uno",
    arrendatario: "Juan Pérez González",
    detalles: "Hermosa cabaña con vista al lago, ideal para familias. Cuenta con todas las comodidades necesarias para una estadía perfecta. Ubicada en Pucón con fácil acceso a la playa.",
    periodo: "diario",
    estado: "disponible",
    fechaContrato: new Date("2024-01-15"),
    valor: 85000,
    imagenes: ["regional_uno_1.jpg", "regional_uno_2.jpg", "regional_uno_vista_lago.jpg"]
  },
  {
    nombre: "Regional Dos",
    arrendatario: "María González López",
    detalles: "Cabaña acogedora en ambiente natural, perfecta para parejas o familias pequeñas. Ambiente tranquilo rodeado de naturaleza en Pucón.",
    periodo: "diario",
    estado: "disponible",
    fechaContrato: new Date("2024-02-20"),
    valor: 75000,
    imagenes: ["regional_dos_1.jpg", "regional_dos_jardin.jpg"]
  },
  {
    nombre: "Regional Tres",
    arrendatario: "Carlos Rodríguez Silva",
    detalles: "Amplia cabaña familiar con múltiples habitaciones y espacios comunes. Ideal para grupos grandes con todas las comodidades modernas.",
    periodo: "mensual",
    estado: "disponible",
    fechaContrato: new Date("2024-03-10"),
    valor: 2850000,
    imagenes: ["regional_tres_1.jpg", "regional_tres_terraza.jpg", "regional_tres_jacuzzi.jpg"]
  },
  {
    nombre: "Regional Cuatro",
    arrendatario: "Ana López Martínez",
    detalles: "Cabaña moderna con diseño contemporáneo y excelente ubicación. Actualmente en proceso de renovación y mejoras.",
    periodo: "diario",
    estado: "mantenimiento",
    fechaContrato: new Date("2024-01-05"),
    valor: 80000,
    imagenes: ["regional_cuatro_1.jpg"]
  },
  {
    nombre: "Teja Uno",
    arrendatario: "Pedro Martínez Ruiz",
    detalles: "Cabaña rústica con techo de tejas, ambiente tradicional y acogedor. Perfecta para quienes buscan tranquilidad en Villarrica.",
    periodo: "diario",
    estado: "disponible",
    fechaContrato: new Date("2024-04-12"),
    valor: 70000,
    imagenes: ["teja_uno_1.jpg", "teja_uno_rustica.jpg"]
  },
  {
    nombre: "Teja Dos",
    arrendatario: "Laura Fernández Castro",
    detalles: "Espaciosa cabaña de estilo tradicional con todas las comodidades modernas. Excelente opción para estadías prolongadas.",
    periodo: "mensual",
    estado: "disponible",
    fechaContrato: new Date("2024-05-18"),
    valor: 2340000,
    imagenes: ["teja_dos_1.jpg", "teja_dos_terraza.jpg", "teja_dos_chimenea.jpg"]
  },
  {
    nombre: "Teja Tres",
    arrendatario: "Roberto Silva Mendoza",
    detalles: "Pequeña cabaña íntima, perfecta para escapadas románticas. Temporalmente fuera de servicio por reparaciones estructurales.",
    periodo: "diario",
    estado: "fuera_servicio",
    fechaContrato: new Date("2023-12-20"),
    valor: 65000,
    imagenes: ["teja_tres_1.jpg"]
  },
  {
    nombre: "Bosque Norte",
    arrendatario: "Patricia Herrera Vega",
    detalles: "Nueva cabaña en medio del bosque, diseño ecológico y sustentable. Perfecta para conectar con la naturaleza.",
    periodo: "diario",
    estado: "disponible",
    fechaContrato: new Date("2024-06-01"),
    valor: 90000,
    imagenes: ["bosque_norte_1.jpg", "bosque_norte_exterior.jpg", "bosque_norte_interior.jpg"]
  },
  {
    nombre: "Vista Volcán",
    arrendatario: "Miguel Torres Sandoval",
    detalles: "Cabaña premium con vista directa al volcán Villarrica. Arrendamiento mensual con servicios incluidos.",
    periodo: "mensual",
    estado: "disponible",
    fechaContrato: new Date("2024-07-15"),
    valor: 3200000,
    imagenes: ["vista_volcan_1.jpg", "vista_volcan_panoramica.jpg"]
  },
  {
    nombre: "Lago Azul",
    arrendatario: "Carmen Díaz Morales",
    detalles: "Cabaña frente al lago con acceso privado a la playa. Ideal para actividades acuáticas y relajación.",
    periodo: "diario",
    estado: "disponible",
    fechaContrato: new Date("2024-08-03"),
    valor: 95000,
    imagenes: ["lago_azul_1.jpg", "lago_azul_playa.jpg", "lago_azul_muelle.jpg", "lago_azul_atardecer.jpg"]
  }
];

// INSTRUCCIONES DE USO:
// 
// Opción 1: Usar el botón en la interfaz
// - Ir a http://localhost:3001/cabanas
// - Hacer clic en "Agregar Datos Ejemplo"
//
// Opción 2: Ejecutar manualmente en la consola del navegador
// (Copiar y pegar el siguiente código en la consola de dev tools)
/*
// Importar la función desde el hook
const { crear } = useCabanaOperaciones();

// Agregar cada cabaña
cabanasSample.forEach(async (cabana, index) => {
  try {
    await crear(cabana);
    console.log(`✓ Cabaña ${index + 1}/${cabanasSample.length} agregada: ${cabana.nombre}`);
  } catch (error) {
    console.error(`✗ Error agregando ${cabana.nombre}:`, error);
  }
});
*/

console.log('📦 Datos de cabañas de ejemplo cargados:', cabanasSample.length, 'cabañas');
console.log('💡 Para usar estos datos, ve a /cabanas y haz clic en "Agregar Datos Ejemplo"');
