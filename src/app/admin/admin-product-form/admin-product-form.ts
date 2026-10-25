import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  ProductosService,
  PresentacionProducto,
  ProductoFirebase
} from '../../core/services/productos';

type VarianteFormulario = PresentacionProducto & {
  activo: boolean;
};

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

  // Recibe el producto cuando se selecciona Editar.
  @Input() set producto(value: ProductoFirebase | null) {
    this.productoActual = value;
    this.cargarFormulario(value);
  }

  productoActual: ProductoFirebase | null = null;

  get esEdicion(): boolean {
    return !!this.productoActual?.id;
  }

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

  presentaciones: VarianteFormulario[] = [];

  constructor(
    private productosService: ProductosService
  ) {
    this.cargarFormulario(null);
  }

  private cargarFormulario(
    producto: ProductoFirebase | null
  ): void {
    this.nombre = producto?.nombre ?? '';
    this.marca = producto?.marca ?? '';
    this.categoria = producto?.categoria ?? 'arabe';
    this.genero = producto?.genero ?? 'hombre';
    this.familia = producto?.familia ?? '';
    this.descripcion = producto?.descripcion ?? '';
    this.notasTexto = producto?.notas?.join(', ') ?? '';
    this.imagen = producto?.imagen ?? '';
    this.publicado = producto?.publicado ?? false;

    const formatos: Array<{
      nombre: string;
      tipo: 'decant' | 'entero';
    }> = [
      { nombre: '2 ml', tipo: 'decant' },
      { nombre: '3 ml', tipo: 'decant' },
      { nombre: '5 ml', tipo: 'decant' },
      { nombre: '10 ml', tipo: 'decant' },
      { nombre: 'Frasco entero', tipo: 'entero' }
    ];

    this.presentaciones = formatos.map(formato => {
      const existente = producto?.presentaciones.find(
        p => p.nombre === formato.nombre
      );

      return {
        nombre: formato.nombre,
        tipo: formato.tipo,
        precio: existente?.precio ?? 0,
        stock: existente?.stock ?? 0,
        activo: producto
          ? !!existente
          : formato.tipo === 'decant'
      };
    });

    this.error.set('');
  }

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
      this.error.set(
        'Ingresa el nombre y la marca del perfume.'
      );
      return;
    }

    if (variantes.length === 0) {
      this.error.set(
        'Selecciona al menos una presentación.'
      );
      return;
    }

    if (variantes.some(p =>
      !Number.isFinite(p.precio) ||
      p.precio <= 0 ||
      !Number.isSafeInteger(p.stock) ||
      p.stock < 0
    )) {
      this.error.set(
        'Los precios deben ser mayores a cero y el stock debe ser un número entero no negativo.'
      );
      return;
    }

    const datos: Omit<ProductoFirebase, 'id' | 'creadoEn'> = {
      nombre: this.nombre.trim(),
      marca: this.marca.trim(),
      categoria: this.categoria,
      genero: this.genero,
      familia: this.familia.trim(),
      descripcion: this.descripcion.trim(),
      notas: this.notasTexto
        .split(',')
        .map(n => n.trim())
        .filter(Boolean),
      imagen: this.imagen.trim(),
      presentaciones: variantes,
      publicado: this.publicado
    };

    this.guardando.set(true);

    try {
      if (this.productoActual?.id) {
        // Actualiza el registro existente.
        await this.productosService.actualizar(
          this.productoActual.id,
          datos
        );

        this.guardado.emit(this.productoActual.id);
      } else {
        // Crea un producto nuevo.
        const id = await this.productosService.crear(datos);

        this.guardado.emit(id);
      }
    } catch (error) {
      console.error('Error guardando producto:', error);

      this.error.set(
        'No se pudieron guardar los cambios. Verifica tu conexión y los permisos de Firebase.'
      );
    } finally {
      this.guardando.set(false);
    }
  }
}
