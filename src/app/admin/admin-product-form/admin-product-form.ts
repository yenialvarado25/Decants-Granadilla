import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ProductosService,
  PresentacionProducto,
  ProductoFirebase
} from '../../core/services/productos';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-product-form.html',
  styleUrl: './admin-product-form.scss'
})
export class AdminProductForm {
  @Output() guardado = new EventEmitter<string>();
  @Output() cancelar = new EventEmitter<void>();

  nombre = '';
  marca = '';
  categoria: ProductoFirebase['categoria'] = 'arabe';
  genero: ProductoFirebase['genero'] = 'hombre';
  familia = '';
  descripcion = '';
  notasTexto = '';
  imagen = '';
  publicado = false;

  readonly guardando = signal(false);
  readonly error = signal('');

  presentaciones: (PresentacionProducto & { activo: boolean })[] = [
    { nombre: '2 ml', tipo: 'decant', precio: 0, stock: 0, activo: true },
    { nombre: '3 ml', tipo: 'decant', precio: 0, stock: 0, activo: true },
    { nombre: '5 ml', tipo: 'decant', precio: 0, stock: 0, activo: true },
    { nombre: '10 ml', tipo: 'decant', precio: 0, stock: 0, activo: true },
    { nombre: 'Frasco entero', tipo: 'entero', precio: 0, stock: 0, activo: false }
  ];

  constructor(private productosService: ProductosService) {}

  async guardar(): Promise<void> {
    if (this.guardando()) return;

    this.error.set('');

    const variantes = this.presentaciones
      .filter(p => p.activo)
      .map(({ nombre, tipo, precio, stock }) => ({
        nombre,
        tipo,
        precio: Number(precio),
        stock: Number(stock)
      }));

    if (!this.nombre.trim() || !this.marca.trim()) {
      this.error.set('Ingresa el nombre y la marca del perfume.');
      return;
    }

    if (!variantes.length) {
      this.error.set('Selecciona al menos una presentación.');
      return;
    }

    if (variantes.some(p =>
      !Number.isFinite(p.precio) ||
      p.precio <= 0 ||
      !Number.isSafeInteger(p.stock) ||
      p.stock < 0
    )) {
      this.error.set(
        'Cada presentación necesita un precio mayor a cero y un stock entero no negativo.'
      );
      return;
    }

    this.guardando.set(true);

    try {
      const id = await this.productosService.crear({
        nombre: this.nombre.trim(),
        marca: this.marca.trim(),
        categoria: this.categoria,
        genero: this.genero,
        familia: this.familia.trim(),
        descripcion: this.descripcion.trim(),
        notas: this.notasTexto.split(',')
          .map(n => n.trim())
          .filter(Boolean),
        imagen: this.imagen.trim(),
        presentaciones: variantes,
        publicado: this.publicado
      });

      this.guardado.emit(id);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      this.error.set(
        'No se pudo guardar el producto. Comprueba tu sesión y los permisos de Firestore.'
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
