
function clopperpearson(x,n) {
  var vx = x
  var vN = n
  var vP = vx/vN
  if(vx==0)
  { low = 0.00 } else
  { var v=vP/2; vsL=0; vsH=vP; var p=2.5/100
    while((vsH-vsL)>1e-5) { if(BinP(vN,v,vx,vN)>p) { vsH=v; v=(vsL+v)/2 } else { vsL=v; v=(v+vsH)/2 } }
    low = 100 * v }
  if(vx==vN)
  { up = 1.00 } else
  { var v=(1+vP)/2; vsL=vP; vsH=1; var p=2.5/100
    while((vsH-vsL)>1e-5) { if(BinP(vN,v,0,vx)<p) { vsH=v; v=(vsL+v)/2 } else { vsL=v; v=(v+vsH)/2 } }
    up = 100 * v }
  return [low.toFixed(2),up.toFixed(2)]
}

function BinP(N,p,x1,x2) {
  var q=p/(1-p); var k=0; var v = 1; var s=0; var tot=0
  while(k<=N) {
    tot=tot+v
    if(k>=x1 & k<=x2) { s=s+v }
    if(tot>1e30){s=s/1e30; tot=tot/1e30; v=v/1e30}
    k=k+1; v=v*q*(N+1-k)/k
  }
  return s/tot
}


function BinP(N,p,x1,x2) {
  var q=p/(1-p); var k=0; var v = 1; var s=0; var tot=0
  while(k<=N) {
    tot=tot+v
    if(k>=x1 & k<=x2) { s=s+v }
    if(tot>1e30){s=s/1e30; tot=tot/1e30; v=v/1e30}
    k=k+1; v=v*q*(N+1-k)/k
  }
  return s/tot
}


function graph(response_data){

  function prepare_data(parameter) {
    data_prepared = response_data[parameter].reverse()
    data_prepared.map((i) => {i['fecha'] = i['fecha'] + 'T00:00-0400'})
    return data_prepared
  }
  
  function set_locale() {
    const locale = {
      "dateTime": "%x, %X",
      "date": "%d/%m/%Y",
      "time": "%-I:%M:%S %p",
      "periods": ["AM", "PM"],
      "days": ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
      "shortDays": ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
      "months": ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
      "shortMonths": ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
    };
    d3.timeFormatDefaultLocale(locale);
  }

  function set_label(day){
    const dateformat = { month: 'long', day: 'numeric' };
    let dateclass = new Date(day['fecha'])
    dateclass = 'd' + dateclass.toLocaleDateString('es-US').replace(/\//g, '')
    metrics['confirmed']
      .html(total_confirmados[day['fecha']])
    metrics['cfr']
      .html(cfr[day['fecha']][0]);
    metrics['confidence_low']
      .html(cfr[day['fecha']][1][0]);
    metrics['confidence_high']
      .html(cfr[day['fecha']][1][1]);
    metrics['test_per_confirmed']
      .html(test_por_confirmado[day['fecha']])
    metrics['date']
      .html(new Date(day['fecha']).toLocaleDateString('es-BO', dateformat))
    d3.selectAll(`.${dateclass}`)
      .attr('r', 8)
      .attr('fill', 'rgb(130, 114, 208, .3)')
      .attr('stroke', 'rgb(130, 114, 208)')
    d3.selectAll(`circle:not(.${dateclass})`)
      .attr('r', 3)
      .attr('fill', 'rgb(102, 77, 219, 0.3)')
      .attr('stroke', 'rgb(102, 77, 219)')
    Object.keys(day['dep']).forEach((departamento) => {
      d3.select(`.selected_value .${departamento} .day_value`).html(day['dep'][departamento]);
    })
  }
  
  function mousemove() {
    const xm = d3.mouse(this)[0];
    const i = Math.round(indexScale.invert(xm));
    if (0 <= i && i < confirmados.length) {
      const d = confirmados[i];
      set_label(d)}
  };

  confirmados = prepare_data('confirmados');
  total_confirmados = {}
  confirmados.forEach((day) => {
    total_confirmados[day['fecha']] = Object.values(day['dep']).reduce((a, b) => a + b)
  })
  
  cfr = {}
  decesos = prepare_data('decesos');
  decesos.forEach((day) => {
    decesos_dia = Object.values(day['dep']).reduce((a, b) => a + b);
    confirmados_dia = total_confirmados[day['fecha']]
    cfr_dia = 100 * (decesos_dia / confirmados_dia)
    ci = clopperpearson(decesos_dia, confirmados_dia)
    cfr[day['fecha']] = [cfr_dia.toFixed(2), ci]
  });

  descartados = prepare_data('descartados');
  total_descartados = {}
  descartados.forEach((day) => {
    total_descartados[day['fecha']] = Object.values(day['dep']).reduce((a, b) => a + b)
  });
  test_por_confirmado = {}
  Object.keys(total_descartados).forEach((day) => {
    test_por_confirmado[day] = ((total_confirmados[day] + total_descartados[day]) / total_confirmados[day]).toFixed(2)
  })
  
  set_locale()
  const margin = {top: 30, right: 20, bottom: 20, left: 30};
  const width = 800 - margin.left - margin.right;
  const height = 480 - margin.top - margin.bottom;
  const svg = d3.select('svg')
  const dateMin = new Date(confirmados[0]['fecha']);
  var dateMax = new Date(confirmados[confirmados.length-1]['fecha']);
  dateMax.setDate(dateMax.getDate());
  const y = d3.
	scaleLinear()
	.domain([0, d3.max(confirmados, function(d){ return +d['dep']['santa_cruz']})])
        .range([height, margin.top]);
  const x = d3
	.scaleTime()
        .domain([dateMin, dateMax])
        .range([margin.left, width]);
  const indexScale = d3
        .scaleLinear()
        .domain([0, confirmados.length -1])
        .range([margin.left, width]);
  
  let metrics = {'confirmed': d3.select('#total_confirmed'),
		 'cfr': d3.select('#cfr'),
		 'confidence_low': d3.select('#cfr_low'),
		 'confidence_high': d3.select('#cfr_up'),
		 'test_per_confirmed': d3.select('#tests_per_confirmed'),
		 'date': d3.select('.selected_date')}
  
  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .attr('class', 'axis')
    .call(d3.axisBottom(x));
  svg.append('g')
    .attr('transform', `translate(${width}, ${0})`)
    .attr('class', 'axis')
    .call(d3.axisRight(y).ticks(5).tickPadding(5));
  
  Object.keys(confirmados[0]['dep']).forEach((departamento) => {
    svg.append('path')
      .datum(confirmados)
      .attr('fill', 'none')
      .attr('stroke', 'rgb(102, 77, 219, 0.3)')
      .attr('stroke-width', 2)
      .attr('class', departamento)
      .attr('cursor', 'pointer')
      .attr('d', d3.line()
            .x(function(d) {
              return x(new Date(d['fecha']));
            })
            .y(function(d) {
              return y(d['dep'][departamento]);
            })
            .curve(d3.curveCardinal),
           )
      .on('mouseover', (d) => {
	d3.select(d3.event.target)
	  .attr('stroke-width', 4)
	  .attr('stroke', '#664ddb')
	dep = d3.select(d3.event.target).node().classList[0]
	d3.select(`h2.${dep} .day_label`).style('color', '#664ddb')
      })
      .on('mouseout', (d) => {
	d3.select(d3.event.target)
	  .attr('stroke-width', 2)
	  .attr('stroke', 'rgb(102, 77, 219, 0.3)')
	dep = d3.select(d3.event.target).node().classList[0]
	d3.select(`h2.${dep} .day_label`).style('color', 'rgb(153, 147, 170)')
      })
    svg.selectAll('.dot')
      .data(confirmados)
      .enter()
      .append('circle')
      .attr('class', function(d) {
	dateclass = new Date(d['fecha'])
	return 'd' + dateclass.toLocaleDateString('es-US').replace(/\//g, '')})
      .attr('fill', 'rgb(102, 77, 219, 0.3)')
      .attr('stroke', 'rgb(102, 77, 219)')
      .attr('r', 3)
      .attr('cursor', 'pointer')
      .attr('cx', function(d) {
  	return x(new Date(d['fecha']));
      })
      .attr('cy', function(d) {
  	return y(d['dep'][departamento]);
      });
    svg
      .on('touchmove', mousemove)
      .on('mousemove', mousemove)
  })

  set_label(confirmados[confirmados.length-1])

};

function init(){
  fetch('https://mauforonda.github.io/covid19-bolivia/data.json').then((response) => {
    response.json().then((response_data) => {
      graph(response_data)
    })})
};


init()
