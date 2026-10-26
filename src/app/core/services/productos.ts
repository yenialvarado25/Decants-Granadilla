import { Injectable } from '@angular/core';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  where
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
  destacado?: boolean;
  creadoEn: number;
  actualizadoEn?: number;     
  
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
    
  async listarPublicados(): Promise<ProductoFirebase[]> {
    const consulta = query(
    this.referencia,
    where('publicado', '==', true)
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

  async actualizar(
    id: string,
    producto: Partial<Omit<ProductoFirebase, 'id' | 'creadoEn'>>
  ): Promise<void> {
    const referencia = doc(firestore, 'productos', id);

    await updateDoc(referencia, {
    ...producto,
    actualizadoEn: Date.now()
    });
}
    async cambiarPublicacion(
      id: string,
      publicado: boolean
    ): Promise<void> {
    const referencia = doc(firestore, 'productos', id);

    await updateDoc(referencia, {
    publicado,
    actualizadoEn: Date.now()
    });
}


}

