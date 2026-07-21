# Monte Carlo Match Simulator for PS2

Simulador de partidos de fútbol basado en el método de Monte Carlo y la distribución de Poisson, desarrollado en JavaScript para la consola PlayStation 2 utilizando el framework **athenaEnv**. El programa permite configurar el número de iteraciones y las métricas de goles esperados (xG) de ambos equipos mediante un teclado en pantalla adaptado para el mando de PS2.

## Características

* **Cálculo Estadístico Real:** Utiliza un algoritmo generador de números pseudoaleatorios corregido (`Math.imul`) y una distribución de Poisson para modelar los goles de cada equipo de forma independiente.
* **Interfaz de Usuario Nativa:** Teclado en pantalla dinámico y renderizado responsivo adaptado a las resoluciones estándar de la consola (640x480).
* **Matriz de Resultados (Score Matrix):** Calcula y dibuja en tiempo real la probabilidad exacta de los marcadores más comunes del 0-0 al 4-4.
* **Métricas de Rendimiento:** Muestra porcentajes de victoria (local/rival), empates y la expectativa de puntos (xPts) en base al estándar de liga (3 puntos por victoria, 1 por empate).
* **Optimización de Rendimiento:** Hilo de renderizado controlado con VSync activo y barra de carga fraccionada para evitar caídas bruscas de frames durante el bucle de simulaciones.

## Funcionamiento

El flujo del script se divide en 4 fases principales controladas por la variable `stage`:

1. **Configuración de Simulaciones (`stage -1`):** Entrada numérica para definir cuántas iteraciones correrá el algoritmo (por defecto inicializado en 100).
2. **Ingreso de xG Local (`stage 0`):** Se introduce el valor decimal de los goles esperados para el equipo de casa.
3. **Ingreso de xG Rival (`stage 1`):** Se introduce el valor decimal para el contrincante.
4. **Procesamiento y Resultados (`stage 2`):** * Ejecuta el bucle de simulación según el número establecido usando la función `poisson(lambda)`.
* Desactiva el flag `running` al finalizar y dibuja la interfaz de dos paneles con las probabilidades y la matriz de marcadores.
* Presionar el botón **CÍRCULO** reinicia los valores del búfer, los contadores de victorias y devuelve la aplicación a la fase inicial.



## Limitaciones

* **Entrada de Datos Estricta:** El teclado virtual no cuenta con control avanzado de excepciones para cadenas mal formateadas; si se introducen caracteres inválidos, el parser asignará valores mínimos por defecto (`100` simulaciones o `0.0f` xG).
* **Límite de la Matriz:** La matriz visual de marcadores está hardcodeada para mostrar combinaciones del rango 0 al 4. Los goles simulados que superen esta cifra se procesan correctamente para las estadísticas globales (Win/Draw/Loss y xPts), pero no se reflejarán visualmente en el panel derecho de distribución.
* **Carga de CPU:** Al ejecutarse sobre hardware real de PS2 a través del entorno de athenaEnv, valores de simulación excesivamente altos (por ejemplo, mayores a 10,000 o 20,000 de golpe) pueden congelar momentáneamente la pantalla o ralentizar el refresco a pesar de la barra de progreso. Se recomienda mantener el muestreo en rangos moderados.

## Controles

* **D-PAD (Arriba / Abajo / Izquierda / Derecha):** Navegación por las teclas del teclado virtual.
* **Botón CRUZ (X):** Seleccionar carácter del teclado / Confirmar "OK".
* **Botón CÍRCULO:** Reiniciar la aplicación desde la pantalla de resultados.
  
## Ejecucion 

Para ejecutar el proyecto tendras que disponer de un emulador de ps2 como lo es (PCSX2). luego solo tendras que arrastrar el archivo "athena.elf" a la ventana del emulador, pero procurando tener habilitada la opcion "HostFS". para mas informacion acerca del tema les recomiendo buscar en internet o ir al repositorio oficial de athenaEnv. 
  
