import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '../../core/firebase.config';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {
  correo = '';
  contrasena = '';

  readonly cargando = signal(false);
  readonly error = signal('');

  constructor(private router: Router) {}

  async ingresar(): Promise<void> {
    if (this.cargando()) return;

    this.error.set('');
    this.cargando.set(true);

    try {
      await signInWithEmailAndPassword(
        firebaseAuth,
        this.correo.trim(),
        this.contrasena
      );

      await this.router.navigateByUrl('/admin');
    } catch {
      this.error.set(
        'No se pudo iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.'
      );
    } finally {
      this.cargando.set(false);
    }
  }
}

