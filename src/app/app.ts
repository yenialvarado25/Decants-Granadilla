import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ProductosService, ProductoFirebase } from './core/services/productos';

type Categoria = 'nicho' | 'arabe' | 'disenador';
type Genero = 'hombre' | 'mujer' | 'unisex';
type Formato = 'decant' | 'entero';
interface Presentacion { id: string; nombre: string; tipo: Formato; precio: number; stock: number; }
interface Producto {
  id: string; nombre: string; marca: string; categoria: Categoria; genero: Genero;
  familia: string; descripcion: string; notas: string[]; imagen?: string;
  presentaciones: Presentacion[]; destacado?: boolean; nuevo?: boolean;
}
interface Pack { id: string; nombre: string; descripcion: string; contenido: string[]; precio: number; stock: number; imagen?: string; }
interface CarritoItem { clave: string; nombre: string; detalle: string; precio: number; cantidad: number; stock: number; }

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})

export class App {
  private readonly router = inject(Router);
readonly esAdmin = signal(this.router.url.startsWith('/admin'));

  
constructor() {
  this.router.events.pipe(
    filter((event): event is NavigationEnd =>
      event instanceof NavigationEnd
    ),
    takeUntilDestroyed()
  ).subscribe(event => {
    const esRutaAdmin = event.urlAfterRedirects.startsWith('/admin');

    this.esAdmin.set(esRutaAdmin);

    if (!esRutaAdmin) {
      void this.cargarCatalogo();
    }
  });

  if (!this.esAdmin()) {
    void this.cargarCatalogo();
  }
}

  // Número del negocio: prefijo 51 + 9 dígitos, sin espacios ni signos.
  readonly whatsapp = '51921435182';
  readonly categorias: { id: Categoria; titulo: string; numero: string; descripcion: string }[] = [
    { id: 'nicho', titulo: 'NICHO', numero: '01', descripcion: 'Firmas exclusivas, aromas con identidad.' },
    { id: 'arabe', titulo: 'ÁRABES', numero: '02', descripcion: 'Intensidad, especias y carácter.' },
    { id: 'disenador', titulo: 'DISEÑADOR', numero: '03', descripcion: 'Íconos contemporáneos para cada ocasión.' }
  ];

  // Datos ilustrativos: modifica precios, stocks y packs antes de vender.
    
readonly productos = signal<Producto[]>([]);

readonly cargandoCatalogo = signal(false);
readonly errorCatalogo = signal('');

private readonly productosService = inject(ProductosService);

async cargarCatalogo(): Promise<void> {
  this.cargandoCatalogo.set(true);
  this.errorCatalogo.set('');

  try {
    const registros = await this.productosService.listarPublicados();

    const productos = registros.map(p => ({
      id: p.id ?? '',
      nombre: p.nombre,
      marca: p.marca,
      categoria: p.categoria,
      genero: p.genero,
      familia: p.familia,
      descripcion: p.descripcion,
      notas: p.notas,
      imagen: p.imagen,
      presentaciones: p.presentaciones.map((v, i) => ({
        id: `${v.tipo}-${i}`,
        nombre: v.nombre,
        tipo: v.tipo,
        precio: v.precio,
        stock: v.stock
      }))
    }));

    this.productos.set(productos);
  } catch (error) {
    console.error('Error cargando catálogo:', error);

    this.errorCatalogo.set(
      'No pudimos cargar el catálogo. Inténtalo nuevamente.'
    );
  } finally {
    this.cargandoCatalogo.set(false);
  }
}

  // Los packs son productos independientes: no mezclar combinaciones con un solo perfume.
  readonly packs = signal<Pack[]>([
    { id: 'p1', nombre: 'Discovery Masculino', descripcion: 'Tres estilos para descubrir tu firma.', contenido: ['3 decants seleccionados', 'Presentaciones a confirmar'], precio: 75, stock: 5 },
    { id: 'p2', nombre: 'Noche & Carácter', descripcion: 'Una selección pensada para ocasiones especiales.', contenido: ['3 decants seleccionados', 'Presentaciones a confirmar'], precio: 89, stock: 4 }
  ]);

  readonly busqueda = signal('');
  readonly categoriaActiva = signal('todos');
  readonly generoActivo = signal('todos');
  readonly formatoActivo = signal('todos');
  readonly orden = signal('destacados');
  readonly carrito = signal<CarritoItem[]>([]);
  readonly carritoAbierto = signal(false);
  readonly menuAbierto = signal(false);
  readonly formatos = [{ valor: 'todos', nombre: 'Todos los formatos' }, { valor: 'decant', nombre: 'Decants 2 / 3 / 5 / 10 ml' }, { valor: 'entero', nombre: 'Frascos enteros' }];

  readonly visibles = computed(() => {
    const q = this.busqueda().trim().toLocaleLowerCase('es');
    const lista = this.productos().filter(p => {
      const texto = [p.nombre, p.marca, p.familia, p.descripcion, ...p.notas].join(' ').toLocaleLowerCase('es');
      return (!q || texto.includes(q)) && (this.categoriaActiva() === 'todos' || p.categoria === this.categoriaActiva()) &&
        (this.generoActivo() === 'todos' || p.genero === this.generoActivo()) &&
        (this.formatoActivo() === 'todos' || p.presentaciones.some(v => v.tipo === this.formatoActivo()));
    });
    if (this.orden() === 'precio-asc') return lista.sort((a, b) => this.precioDesde(a) - this.precioDesde(b));
    if (this.orden() === 'precio-desc') return lista.sort((a, b) => this.precioDesde(b) - this.precioDesde(a));
    if (this.orden() === 'nombre') return lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return lista.sort((a, b) => Number(!!b.destacado) - Number(!!a.destacado));
  });
  readonly cantidadCarrito = computed(() => this.carrito().reduce((s, p) => s + p.cantidad, 0));
  readonly total = computed(() => this.carrito().reduce((s, p) => s + p.precio * p.cantidad, 0));
  readonly destacados = computed(() => this.productos().filter(p => p.destacado));

  irCatalogo(categoria = 'todos'): void {
    this.categoriaActiva.set(categoria);
    this.menuAbierto.set(false);
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  }
  irSeccion(id: string): void {
    this.menuAbierto.set(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
  limpiarFiltros(): void {
    this.busqueda.set(''); this.categoriaActiva.set('todos');
    this.generoActivo.set('todos'); this.formatoActivo.set('todos');
  }
  precioDesde(p: Producto): number { return Math.min(...p.presentaciones.map(v => v.precio)); }
  precio(n: number): string { return `S/ ${n.toFixed(2)}`; }

  agregarProducto(p: Producto, idPresentacion: string): void {
    const v = p.presentaciones.find(x => x.id === idPresentacion);
    if (!v) return;
    this.agregarAlCarrito({ clave: `perfume-${p.id}-${v.id}`, nombre: p.nombre, detalle: `${p.marca} · ${v.nombre}`, precio: v.precio, stock: v.stock, cantidad: 1 });
  }
  agregarPack(p: Pack): void {
    this.agregarAlCarrito({ clave: `pack-${p.id}`, nombre: p.nombre, detalle: 'Pack promocional · contenido por confirmar', precio: p.precio, stock: p.stock, cantidad: 1 });
  }
  private agregarAlCarrito(nuevo: CarritoItem): void {
    const existe = this.carrito().find(x => x.clave === nuevo.clave);
    if (nuevo.stock < 1 || (existe && existe.cantidad >= existe.stock)) return;
    this.carrito.update(items => existe ? items.map(i => i.clave === nuevo.clave ? { ...i, cantidad: i.cantidad + 1 } : i) : [...items, nuevo]);
    this.carritoAbierto.set(true);
  }
  cambiarCantidad(item: CarritoItem, delta: number): void {
    this.carrito.update(items => items.map(i => i.clave === item.clave ? { ...i, cantidad: Math.min(i.stock, i.cantidad + delta) } : i).filter(i => i.cantidad > 0));
  }
  private abrirMensaje(mensaje: string): void {
    window.open(`https://wa.me/${this.whatsapp}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer');
  }
  abrirWhatsApp(): void {
    this.abrirMensaje('Hola, Decants Granadilla. Quisiera información sobre sus perfumes, presentaciones y promociones.');
  }
  finalizarPedido(): void {
    if (!this.carrito().length) return;
    const detalle = this.carrito().map(i => `• ${i.nombre} (${i.detalle}) x${i.cantidad}: ${this.precio(i.precio * i.cantidad)}`).join('\n');
    this.abrirMensaje(`Hola, Decants Granadilla. Quiero consultar este pedido:\n\n${detalle}\n\nTotal referencial: ${this.precio(this.total())}\n¿Me confirman disponibilidad, contenido de packs y envío?`);
  }
  
}
