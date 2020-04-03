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
    d3.select('#total_confirmed')
      .html(total_confirmados[day['fecha']])
    d3.select('#cfr')
      .html(cfr[day['fecha']].toFixed(2))
    d3.select('.selected_date')
      .html(new Date(day['fecha']).toLocaleDateString('es-BO', dateformat))
    d3.selectAll(`.${dateclass}`)
      .attr('r', 8)
      .attr('fill', 'rgb(130, 114, 208, .3)')
      .attr('stroke', 'rgb(130, 114, 208)')
    d3.selectAll(`circle:not(.${dateclass})`)
      .attr('r', 3)
      .attr('fill', 'rgb(153, 147, 170, .3)')
      .attr('stroke', 'rgb(153, 147, 170)')
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
    cfr[day['fecha']] = Object.values(day['dep']).reduce((a, b) => a + b) / total_confirmados[day['fecha']] * 100
  });
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
      .attr('stroke', 'rgb(153, 147, 170)')
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
	  .attr('stroke', 'rgb(130, 114, 208)')
	dep = d3.select(d3.event.target).node().classList[0]
	d3.select(`h2.${dep} .day_label`).style('color', 'rgb(130, 114, 208)')
      })
      .on('mouseout', (d) => {
	d3.select(d3.event.target)
	  .attr('stroke-width', 2)
	  .attr('stroke', 'rgb(153, 147, 170)')
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
      .attr('fill', 'rgb(153, 147, 170, .3)')
      .attr('stroke', 'rgb(153, 147, 170)')
      .attr('r', 3)
      .attr('cursor', 'pointer')
      .attr('cx', function(d) {
  	return x(new Date(d['fecha']));
      })
      .attr('cy', function(d) {
  	return y(d['dep'][departamento]);
      });
    svg
      .on('mousemove', mousemove)
      .on('touchmove', mousemove)
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