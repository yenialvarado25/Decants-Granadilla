import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signOut } from 'firebase/auth';

import { firebaseAuth } from '../../core/firebase.config';
import {
  ProductosService,
  ProductoFirebase
} from '../../core/services/productos';

import { AdminProductForm } from '../admin-product-form/admin-product-form';

// Secciones disponibles en el panel
type Seccion =
  | 'dashboard'
  | 'productos'
  | 'nuevo-producto'
  | 'editar-producto'
  | 'packs'
  | 'configuracion';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [FormsModule, AdminProductForm],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss'
})
export class AdminPanel {

  // Servicios
  private readonly router = inject(Router);
  private readonly productosService = inject(ProductosService);

  // Navegación
  readonly seccion = signal<Seccion>('dashboard');
  readonly menuAbierto = signal(false);
  readonly busqueda = signal('');

  // Estado de Firebase
  readonly productosFirebase = signal<ProductoFirebase[]>([]);
  readonly cargandoProductos = signal(false);
  readonly errorProductos = signal('');

  // Mensaje después de registrar un producto
  readonly productoGuardado = signal('');

  constructor() {
    // Cargar los productos guardados en Firebase
    void this.cargarProductos();
  }

  // ====================================
  // PRODUCTOS DE FIREBASE
  // ====================================

  async cargarProductos(): Promise<void> {
    this.cargandoProductos.set(true);
    this.errorProductos.set('');

    try {
      const productos = await this.productosService.listar();
      this.productosFirebase.set(productos);
    } catch (error) {
      console.error('Error leyendo productos:', error);

      this.errorProductos.set(
        'No se pudieron cargar los productos desde Firebase.'
      );
    } finally {
      this.cargandoProductos.set(false);
    }
  }

  // Adaptar los productos de Firebase para mostrarlos en la tabla
  readonly inventario = computed(() =>
    this.productosFirebase().map(p => ({
      id: p.id ?? '',
      nombre: p.nombre,
      marca: p.marca,
      categoria: p.categoria,

      precioDesde: p.presentaciones.length > 0
        ? Math.min(...p.presentaciones.map(v => v.precio))
        : 0,

      stock: p.presentaciones.reduce(
        (total, variante) => total + variante.stock,
        0
      ),

      activo: p.publicado
    }))
  );

  
  readonly productoSeleccionado = signal<ProductoFirebase | null>(null);

  editarProducto(id: string): void {
    const producto = this.productosFirebase().find(
      p => p.id === id
    );

    if (!producto) {
      this.errorProductos.set('No se encontró el producto.');
      return;
    }

    this.productoGuardado.set('');
    this.productoSeleccionado.set(producto);
    this.navegar('editar-producto');
    }

  // ====================================
  // ESTADÍSTICAS DEL DASHBOARD
  // ====================================

  readonly totalProductos = computed(() =>
    this.inventario().length
  );

  readonly stockBajo = computed(() =>
    this.inventario().filter(p => p.stock <= 8).length
  );

  // ====================================
  // BUSCADOR
  // ====================================

  readonly resultados = computed(() => {
    const termino = this.busqueda()
      .trim()
      .toLocaleLowerCase('es');

    return this.inventario().filter(p =>
      `${p.nombre} ${p.marca} ${p.categoria}`
        .toLocaleLowerCase('es')
        .includes(termino)
    );
  });

  // ====================================
  // NAVEGACIÓN DEL PANEL
  // ====================================

  navegar(seccion: Seccion): void {
    this.seccion.set(seccion);
    this.menuAbierto.set(false);
  }

  titulo(): string {
    switch (this.seccion()) {
      case 'productos':
        return 'Gestión de productos';

      case 'nuevo-producto':
        return 'Nuevo producto';

      case 'editar-producto':
        return 'Editar producto';
        
      case 'packs':
        return 'Packs promocionales';

      case 'configuracion':
        return 'Configuración';

      default:
        return 'Dashboard';
    }
  }

  // ====================================
  // AGREGAR PRODUCTOS
  // ====================================

  
  abrirNuevoProducto(): void {
    this.productoSeleccionado.set(null);
    this.productoGuardado.set('');
    this.navegar('nuevo-producto');
  }

    async alGuardarProducto(id: string): Promise<void> {
      const eraEdicion = this.seccion() === 'editar-producto';

      await this.cargarProductos();

      if (this.errorProductos()) return;

      this.productoGuardado.set(
      eraEdicion
          ? 'Producto actualizado correctamente en Firebase.'
          : 'Producto registrado correctamente en Firebase.'
      );

      this.productoSeleccionado.set(null);
      this.navegar('productos');
    }


  // ====================================
  // FORMATO DE PRECIOS
  // ====================================

  precio(valor: number): string {
    return `S/ ${valor.toFixed(2)}`;
  }
   // CAMBIANDO PUBLICACION DE PRODUCTOS
   // ====================================
   
readonly cambiandoPublicacion = signal<string | null>(null);

async alternarPublicacion(id: string): Promise<void> {
  if (this.cambiandoPublicacion()) return;

  const producto = this.productosFirebase().find(p => p.id === id);
  if (!producto) return;

  this.cambiandoPublicacion.set(id);
  this.errorProductos.set('');

  try {
    const nuevoEstado = !producto.publicado;

    await this.productosService.cambiarPublicacion(
      id,
      nuevoEstado
    );

    this.productosFirebase.update(productos =>
      productos.map(p =>
        p.id === id
          ? { ...p, publicado: nuevoEstado }
          : p
      )
    );

    this.productoGuardado.set(
      nuevoEstado
        ? 'Producto publicado correctamente.'
        : 'Producto desactivado correctamente.'
    );
  } catch (error) {
    console.error('Error actualizando publicación:', error);
    this.errorProductos.set(
      'No se pudo cambiar el estado del producto.'
    );
  } finally {
    this.cambiandoPublicacion.set(null);
  }
}
  // ====================================
  // CERRAR SESIÓN
  // ====================================

  async cerrarSesion(): Promise<void> {
    try {
      await signOut(firebaseAuth);

      await this.router.navigateByUrl('/admin/login');
    } catch (error) {
      console.error('No se pudo cerrar sesión:', error);

      alert('Ocurrió un problema al cerrar la sesión.');
    }
  }
}
