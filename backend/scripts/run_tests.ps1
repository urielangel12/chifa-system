$base = "http://localhost:3000"

Write-Host "1) Abrir jornada..."
Invoke-RestMethod -Uri "$base/api/jornada/abrir" -Method Post -ContentType "application/json" -Body '{}' | ConvertTo-Json | Write-Host

Write-Host "\n2) Obtener platos disponibles"
$platos = Invoke-RestMethod -Uri "$base/api/platos"
$platos | Format-Table

function Do-OrdersForMesa([int]$mesaId) {
    for ($i = 1; $i -le 2; $i++) {
        Write-Host "\n--- Abrir pedido para mesa $mesaId (iteración $i) ---"
        Invoke-RestMethod -Uri "$base/api/pedidos/abrir/$mesaId" -Method Post | ConvertTo-Json | Write-Host
        Start-Sleep -Milliseconds 200

        $pedido = Invoke-RestMethod -Uri "$base/api/pedidos/mesa/$mesaId"
        $pedidoId = $pedido.pedidoId
        Write-Host "Pedido abierto id: $pedidoId"

        # Agregar dos platos distintos si existen
        if ($platos.Count -ge 2) {
            Invoke-RestMethod -Uri "$base/api/pedidos/$pedidoId/agregar" -Method Post -ContentType "application/json" -Body (@{platoId = $platos[0].id; cantidad = 2} | ConvertTo-Json) | ConvertTo-Json | Write-Host
            Invoke-RestMethod -Uri "$base/api/pedidos/$pedidoId/agregar" -Method Post -ContentType "application/json" -Body (@{platoId = $platos[1].id; cantidad = 1} | ConvertTo-Json) | ConvertTo-Json | Write-Host
        } else {
            Write-Host "No hay suficientes platos en la DB para agregar."
        }

        # Cerrar pedido con EFECTIVO
        Invoke-RestMethod -Uri "$base/api/pedidos/$pedidoId/cerrar" -Method Post -ContentType "application/json" -Body (@{metodoPago = "EFECTIVO"} | ConvertTo-Json) | ConvertTo-Json | Write-Host
        Start-Sleep -Milliseconds 200
    }
}

# Ejecutar para mesas 1 y 2
Do-OrdersForMesa -mesaId 1
Do-OrdersForMesa -mesaId 2

Write-Host "\n3) Cerrar jornada..."
Invoke-RestMethod -Uri "$base/api/jornada/cerrar" -Method Post -ContentType "application/json" -Body (@{observaciones = "Cierre automatizado de prueba"} | ConvertTo-Json) | ConvertTo-Json | Write-Host

Write-Host "\n4) Descargar Reporte Diario (Reporte_Diario.xlsx)"
Invoke-WebRequest -Uri "$base/api/reportes/diario" -OutFile "Reporte_Diario.xlsx"
Write-Host "Reporte descargado: $(Resolve-Path .\Reporte_Diario.xlsx)"
