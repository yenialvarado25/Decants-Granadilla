import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../../core/firebase.config';

type Seccion = 'dashboard' | 'productos' | 'packs' | 'configuracion';

interface ProductoAdmin {
  id: number;
  nombre: string;
  marca: string;
  categoria: 'Nicho' | 'Árabe' | 'Diseñador';
  precioDesde: number;
  stock: number;
  activo: boolean;
}

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-panel.html',
  styleUrl: './admin-panel.scss'
})
export class AdminPanel {
  
constructor(private router: Router) {}

async cerrarSesion(): Promise<void> {
  try {
    await signOut(firebaseAuth);
    await this.router.navigateByUrl('/admin/login');
  } catch (error) {
    console.error('No se pudo cerrar sesión:', error);
    alert('Ocurrió un problema al cerrar la sesión.');
  }
}

  readonly seccion = signal<Seccion>('dashboard');
  readonly menuAbierto = signal(false);
  readonly busqueda = signal('');

  // Información de demostración, no sincronizada con la tienda.
  readonly productos = signal<ProductoAdmin[]>([
    {
      id: 1, nombre: 'Baccarat Rouge 540',
      marca: 'Maison Francis Kurkdjian',
      categoria: 'Nicho', precioDesde: 28,
      stock: 8, activo: true
    },
    {
      id: 2, nombre: 'Khamrah',
      marca: 'Lattafa',
      categoria: 'Árabe', precioDesde: 10,
      stock: 15, activo: true
    },
    {
      id: 3, nombre: 'Sauvage',
      marca: 'Dior',
      categoria: 'Diseñador', precioDesde: 12,
      stock: 8, activo: true
    }
  ]);

  readonly totalProductos = computed(() => this.productos().length);
  readonly stockBajo = computed(() =>
    this.productos().filter(p => p.stock <= 8).length
  );

  readonly resultados = computed(() => {
    const termino = this.busqueda().toLocaleLowerCase('es').trim();

    return this.productos().filter(p =>
      `${p.nombre} ${p.marca} ${p.categoria}`
        .toLocaleLowerCase('es')
        .includes(termino)
    );
  });

  navegar(seccion: Seccion): void {
    this.seccion.set(seccion);
    this.menuAbierto.set(false);
  }

  titulo(): string {
    switch (this.seccion()) {
      case 'productos': return 'Gestión de productos';
      case 'packs': return 'Packs promocionales';
      case 'configuracion': return 'Configuración';
      default: return 'Dashboard';
    }
  }

  precio(valor: number): string {
    return `S/ ${valor.toFixed(2)}`;
  }
}
