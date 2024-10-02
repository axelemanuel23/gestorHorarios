import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';

const colors = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
];

const sectores = ['Micro', 'Corredor', 'Casilla'];

const HorarioEditable = () => {
  const [horarios, setHorarios] = useState(() => {
    const saved = localStorage.getItem('horarios');
    return saved ? JSON.parse(saved) : Array(10).fill('');
  });
  const [encabezadosFilas, setEncabezadosFilas] = useState(() => {
    const saved = localStorage.getItem('encabezadosFilas');
    return saved ? JSON.parse(saved) : Array(11).fill().map((_, index) => `Casilla ${index + 1}`);
  });
  const [matriz, setMatriz] = useState(() => {
    const saved = localStorage.getItem('matriz');
    return saved ? JSON.parse(saved) : Array(11).fill().map(() => Array(10).fill(null));
  });
  const [agentes, setAgentes] = useState(() => {
    const saved = localStorage.getItem('agentes');
    return saved ? JSON.parse(saved) : [];
  });
  const [sectoresData, setSectoresData] = useState(() => {
    const saved = localStorage.getItem('sectoresData');
    return saved ? JSON.parse(saved) : sectores.map(sector => ({ nombre: sector, agentes: [] }));
  });
  
  const [selectedHorario, setSelectedHorario] = useState(null);
  const [horarioTexto, setHorarioTexto] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [nuevoSector, setNuevoSector] = useState('Micro');
  const [ordenamiento, setOrdenamiento] = useState('alfabetico');

  useEffect(() => {
    localStorage.setItem('horarios', JSON.stringify(horarios));
    localStorage.setItem('encabezadosFilas', JSON.stringify(encabezadosFilas));
    localStorage.setItem('matriz', JSON.stringify(matriz));
    localStorage.setItem('agentes', JSON.stringify(agentes));
    localStorage.setItem('sectoresData', JSON.stringify(sectoresData));
  }, [sectoresData, horarios, encabezadosFilas, matriz, agentes]);

  const limpiarLocalStorage = () => {
    localStorage.removeItem('horarios');
    localStorage.removeItem('encabezadosFilas');
    localStorage.removeItem('matriz');
    localStorage.removeItem('agentes');
    localStorage.removeItem('sectoresData');

    setHorarios(Array(10).fill(''));
    setEncabezadosFilas(Array(11).fill().map((_, index) => `Casilla ${index + 1}`));
    setMatriz(Array(11).fill().map(() => Array(10).fill(null)));
    setAgentes([]);
    setSectoresData(sectores.map(sector => ({ nombre: sector, agentes: [] })));
  };

  const exportarCSV = () => {
    const datosCSV = [
      // Encabezados
      ['tipo', 'id', 'nombre', 'apellido', 'horas', 'sector', 'color'],
      // Datos de los agentes
      ...agentes.map(agente => ['agente', agente.id, agente.nombre, agente.apellido, agente.horas, agente.sector, agente.color]),
      // Encabezados de filas
      ['encabezado', ...encabezadosFilas],
      // Horarios
      ['horario', ...horarios],
      // Matriz
      ...matriz.map((fila, index) => ['matriz', index, ...fila])
    ];
  
    const csvContent = Papa.unparse(datosCSV);
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'horarios.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para importar la matriz desde un archivo CSV
  const importarCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target.result;
      const parsedData = Papa.parse(csvData, { header: false }).data;
      
      const nuevosAgentes = [];
      let nuevosEncabezadosFilas = [];
      let nuevosHorarios = [];
      const nuevaMatriz = [];
      const nuevosSectoresData = sectores.map(sector => ({ nombre: sector, agentes: [] }));

      parsedData.forEach(fila => {
        switch(fila[0]) {
          case 'agente':
            const agente = {
              id: fila[1],
              nombre: fila[2],
              apellido: fila[3],
              horas: parseInt(fila[4], 10),
              sector: fila[5],
              color: fila[6]
            };
            nuevosAgentes.push(agente);
            const sectorIndex = nuevosSectoresData.findIndex(s => s.nombre === agente.sector);
            if (sectorIndex !== -1) {
              nuevosSectoresData[sectorIndex].agentes.push(agente);
            }
            break;
          case 'encabezado':
            nuevosEncabezadosFilas = fila.slice(1);
            break;
          case 'horario':
            nuevosHorarios = fila.slice(1);
            break;
          case 'matriz':
            nuevaMatriz.push(fila.slice(2));
            break;
        }
      });

      setAgentes(nuevosAgentes);
      setEncabezadosFilas(nuevosEncabezadosFilas);
      setHorarios(nuevosHorarios);
      setMatriz(nuevaMatriz);
      setSectoresData(nuevosSectoresData);
    };
  
    reader.readAsText(file);
  };

  const generarTextoHorario = () => {
    if (selectedHorario === null) return;
    console.log(sectoresData)
    let texto = ""
    if(selectedHorario === -1 ){
      texto += `-- Sectores -- \n`
      sectoresData.forEach((fila, index) => {
        texto += `${fila.nombre}:\n`
        fila.agentes.forEach((columna, index) => {
          texto += ` - ${columna.nombre} ${columna.apellido}\n` 
        })
      })
    }else{
      texto += `Horario: ${horarios[selectedHorario]}\n`;
      matriz.forEach((fila, indexFila) => {
        if (fila[selectedHorario]) {
          texto += `Casilla ${indexFila + 1}: ${fila[selectedHorario]}\n`;
        }
      });
    }
    setHorarioTexto(texto.trim());
  }

  const eliminarTextoHorario = () => {
    setHorarioTexto('');
  };

  const editarHorario = (index, valor) => {
    const nuevosHorarios = [...horarios];
    nuevosHorarios[index] = valor;
    setHorarios(nuevosHorarios);
  };

  const editarEncabezadoFila = (index, valor) => {
    const nuevosEncabezados = [...encabezadosFilas];
    nuevosEncabezados[index] = valor;
    setEncabezadosFilas(nuevosEncabezados);
  };

  const agregarAgente = () => {
    if (nuevoNombre.trim() !== '' && nuevoApellido.trim() !== '') {
      const color = colors[agentes.length % colors.length];
      const nuevoAgente = {
        id: uuidv4(), // Generar un ID único para el agente
        nombre: nuevoNombre,
        apellido: nuevoApellido,
        horas: 0,
        color,
        sector: nuevoSector
      };
      const nuevosSectoresData = sectoresData.map(sectorData => {
        if (sectorData.nombre === nuevoSector) {
          return {
            ...sectorData,
            agentes: [...sectorData.agentes, nuevoAgente]
          };
        }
        return sectorData;
      });

      setSectoresData(nuevosSectoresData);

      setAgentes([...agentes, nuevoAgente]);
      setNuevoNombre('');
      setNuevoApellido('');
    }
  };

  const eliminarAgente = (id) => {
    const nuevosAgentes = agentes.filter(agente => agente.id !== id);

     // Eliminar al agente de la matriz
    const nuevaMatriz = matriz.map(fila => 
    fila.map(celda => celda === id ? null : celda)
    );

    const nuevosSectoresData = sectoresData.map(sectorData => ({
      ...sectorData,
      agentes: sectorData.agentes.filter(agente => agente.id !== id)
    }));

    setAgentes(nuevosAgentes);
    setSectoresData(nuevosSectoresData);
    setMatriz(nuevaMatriz);
  };

  const manejarDragStart = (e, agente, fila, columna) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ agente, fila, columna }));
  };

  const manejarDragOver = (e) => {
    e.preventDefault();
  };

  const manejarDrop = (e, fila, columna, nuevoSector = null) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text'));
    const agenteData = data.agente;
    const filaOrigen = data.fila;
    const columnaOrigen = data.columna;
  
    if (nuevoSector) {
      // Existing code for handling sector changes
      // ...
    } else {
      const nuevaMatriz = matriz.map(row => [...row]);
      const nombreCompleto = `${agenteData.nombre} ${agenteData.apellido}`;
      
      // Función para verificar si el agente ya está en otra fila de la misma columna
      const agenteYaEnColumna = (col) => nuevaMatriz.some((row, idx) => 
        idx !== fila && row[col] === nombreCompleto
      );
  
      // Check if it's a move within the matrix
      if (filaOrigen !== undefined && columnaOrigen !== undefined) {
        if (columna === columnaOrigen) {
          // Movimiento dentro de la misma columna, permitido
          nuevaMatriz[filaOrigen][columnaOrigen] = null;
          nuevaMatriz[fila][columna] = nombreCompleto;
          setMatriz(nuevaMatriz);
        } else if (nuevaMatriz[fila][columna] === null || nuevaMatriz[fila][columna] === '') {
          // Movimiento a otra columna vacía, verificar si ya está en esa columna
          if (agenteYaEnColumna(columna)) {
            alert(`${nombreCompleto} ya está asignado en este horario.`);
            return;
          }
          // Realizar el movimiento
          nuevaMatriz[filaOrigen][columnaOrigen] = null;
          nuevaMatriz[fila][columna] = nombreCompleto;
          setMatriz(nuevaMatriz);
        } else {
          // Intento de mover a una columna diferente que ya está ocupada
          alert(`No se puede mover a esta posición. La casilla ya está ocupada por otro agente.`);
          return;
        }
      } else {
        // It's a new assignment
        if (agenteYaEnColumna(columna)) {
          alert(`${nombreCompleto} ya está asignado en este horario.`);
          return;
        }
  
        if (nuevaMatriz[fila][columna] === null || nuevaMatriz[fila][columna] === '') {
          nuevaMatriz[fila][columna] = nombreCompleto;
          setMatriz(nuevaMatriz);
  
          // Update hours for new assignment
          const nuevosAgentes = agentes.map(agente => 
            agente.nombre === agenteData.nombre && agente.apellido === agenteData.apellido
              ? { ...agente, horas: agente.horas + 1 }
              : agente
          );
          setAgentes(nuevosAgentes);
        } else {
          alert(`La posición (${fila + 1}, ${columna + 1}) ya está ocupada.`);
        }
      }
    }
  };

  const manejarClickFicha = (fila, columna) => {
    const nuevaMatriz = matriz.map(row => [...row]);
    if (nuevaMatriz[fila][columna] !== null) {
      const nombreCompleto = nuevaMatriz[fila][columna];
      nuevaMatriz[fila][columna] = null;
      setMatriz(nuevaMatriz);

      const nuevosAgentes = agentes.map(agente => 
        `${agente.nombre} ${agente.apellido}` === nombreCompleto
          ? { ...agente, horas: Math.max(0, agente.horas - 1) }
          : agente
      );
      setAgentes(nuevosAgentes);
    }
  };

  const ordenarAgentesPorSector = () => {
    let agentesOrdenados = [...agentes];
    
    if (ordenamiento === 'alfabetico') {
      agentesOrdenados.sort((a, b) => {
        const nombreA = `${a.apellido} ${a.nombre}`.toLowerCase();
        const nombreB = `${b.apellido} ${b.nombre}`.toLowerCase();
        return nombreA.localeCompare(nombreB);
      });
    } else {
      agentesOrdenados.sort((a, b) => b.horas - a.horas);
    }
  
    // Agrupar los agentes por sector
    const agentesPorSector = sectores.map(sector => ({
      sector,
      agentes: agentesOrdenados.filter(agente => agente.sector === sector),
    }));
    
    return agentesPorSector;
  };

  const cambiarOrdenamiento = () => {
    setOrdenamiento(ordenamiento === 'alfabetico' ? 'horas' : 'alfabetico');
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Agentes</h2>
        <div className="flex items-center mb-2">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="border p-2 mr-2"
            placeholder="Nombre"
          />
          <input
            type="text"
            value={nuevoApellido}
            onChange={(e) => setNuevoApellido(e.target.value)}
            className="border p-2 mr-2"
            placeholder="Apellido"
          />
          <select
            value={nuevoSector}
            onChange={(e) => setNuevoSector(e.target.value)}
            className="border p-2 mr-2"
          >
            {sectores.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
          <button
            onClick={agregarAgente}
            className="bg-blue-500 text-white p-2 rounded"
          >
            <Plus size={20} />
          </button>
        </div>
      <div className="mt-4 mb-4">
        <button
          onClick={exportarCSV}
          className="bg-green-500 text-white p-2 rounded mr-2"
        >
          Exportar a CSV
        </button>
        <input
          type="file"
          accept=".csv"
          onChange={importarCSV}
          className="p-2 border"
        />
      </div>
        <div className="flex items-center mb-2">
          <button
            onClick={cambiarOrdenamiento}
            className="bg-gray-300 text-gray-700 p-2 rounded flex items-center"
          >
            <ArrowUpDown size={20} className="mr-2" />
            {ordenamiento === 'alfabetico' ? 'Ordenado alfabeticamente' : 'Ordenado por carga horaria'}
          </button>
        </div>
        <div className="flex space-x-4">
          {ordenarAgentesPorSector().map(({ sector, agentes }) => (
            <div 
              key={sector} 
              className="flex-1 bg-white p-4 rounded shadow"
              onDragOver={manejarDragOver}
              onDrop={(e) => manejarDrop(e, null, null, sector)}
            >
              <h3 className="text-lg font-semibold mb-2 capitalize">{sector}</h3>
              <div className="flex flex-col gap-2">
                {agentes.map(agente => (
                  <div
                    key={agente.id} // Usar el id único aquí
                    className={`${agente.color} p-2 rounded flex items-center text-white cursor-pointer`}
                    draggable
                    onDragStart={(e) => manejarDragStart(e, agente)}
                  >
                    <span className="mr-2">{agente.apellido}, {agente.nombre} ({agente.horas}h)</span>
                    <button
                      onClick={() => eliminarAgente(agente.id)} // Pasar el id aquí también
                      className="text-red-200 hover:text-red-100 ml-auto"
                    >
                    <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
      <button
        onClick={limpiarLocalStorage} // Agrega el botón aquí
        className="bg-red-500 text-white p-2 rounded ml-2"
      >Borrar Todo
        <Trash2 size={14} />
      </button>
      </div>
      <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Seleccionar Horario</h3>
          <select
            className="border p-2 mb-2"
            value={selectedHorario || ''}
            onChange={(e) => setSelectedHorario(Number(e.target.value))}
          >
            <option value="" disabled>Selecciona un horario</option>
            {horarios.map((horario, index) => (
              <option key={index} value={index}>{horario}</option>
            ))}
            <option value={-1} >Sectores</option>
          </select>
          <button
            onClick={generarTextoHorario}
            className="bg-blue-500 text-white p-2 rounded ml-2 cursor-pointer"
            disabled={selectedHorario === null}
          >
            Generar Texto
          </button>
        </div>
        
        {horarioTexto && (
          <div className="mt-4 bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-2">Texto Generado</h3>
            <pre className="whitespace-pre-wrap">{horarioTexto}</pre>
            <button
              onClick={eliminarTextoHorario}
              className="bg-red-500 text-white p-2 rounded mt-2"
            >
              Eliminar Texto
            </button>
          </div>
        )}
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded">
          <thead>
            <tr>
              <th className="border p-2 w-32">
                <input
                  type="text"
                  value={encabezadosFilas[0]}
                  onChange={(e) => editarEncabezadoFila(0, e.target.value)}
                  className="w-full text-center font-bold"
                  placeholder="Entrada/Salida"
                />
              </th>
              {horarios.map((horario, index) => (
                <th key={index} className="border p-2">
                  <input
                    type="text"
                    value={horario}
                    onChange={(e) => editarHorario(index, e.target.value)}
                    className="w-full text-center"
                    placeholder={`Horario ${index + 1}`}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matriz.map((fila, filaIndex) => (
              <tr key={filaIndex}>
                <td className="border p-2 w-32">
                  <input
                    type="text"
                    value={encabezadosFilas[filaIndex + 1]}
                    onChange={(e) => editarEncabezadoFila(filaIndex + 1, e.target.value)}
                    className="w-full font-bold"
                  />
                </td>
                {fila.map((celda, columnaIndex) => (
                  <td
                  key={columnaIndex}
                  className="border p-2 w-24 h-12"
                  onDragOver={manejarDragOver}
                  onDrop={(e) => manejarDrop(e, filaIndex, columnaIndex)}
                  onClick={() => manejarClickFicha(filaIndex, columnaIndex)}
                >
                  {celda && (
                    <div 
                      className={`w-full h-full flex items-center justify-center ${agentes.find(a => `${a.nombre} ${a.apellido}` === celda)?.color} text-white rounded cursor-pointer`}
                      draggable
                      onDragStart={(e) => manejarDragStart(e, { nombre: celda.split(' ')[0], apellido: celda.split(' ')[1] }, filaIndex, columnaIndex)}
                    >
                      {celda}
                    </div>
                  )}
                </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HorarioEditable;