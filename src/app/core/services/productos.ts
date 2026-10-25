import { Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';

import { firestore } from '../firebase.config';

export interface PresentacionProducto {
  nombre: string;
  tipo: 'decant' | 'entero';
  precio: number;
  stock: number;
}

export interface ProductoFirebase {
  id?: string;
  nombre: string;
  marca: string;
  categoria: 'nicho' | 'arabe' | 'disenador';
  genero: 'hombre' | 'mujer' | 'unisex';
  descripcion: string;
  familia: string;
  notas: string[];
  imagen: string;
  presentaciones: PresentacionProducto[];
  publicado: boolean;
  creadoEn: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private readonly referencia = collection(
    firestore,
    'productos'
  );

  async listar(): Promise<ProductoFirebase[]> {
    const consulta = query(
      this.referencia,
      orderBy('creadoEn', 'desc')
    );

    const resultado = await getDocs(consulta);

    return resultado.docs.map(documento => ({
      ...documento.data(),
      id: documento.id
    } as ProductoFirebase));
  }

  async crear(
    producto: Omit<ProductoFirebase, 'id' | 'creadoEn'>
  ): Promise<string> {
    const resultado = await addDoc(this.referencia, {
      ...producto,
      creadoEn: Date.now()
    });

    return resultado.id;
  }
}

