import numeral from 'numeral';
import React from 'react'
import ReactApexChart from 'react-apexcharts';

export default function Chars({ type = "bar", pattern = "stackedColumn", options = {}, series = [], height = "100%" }) {
  const getOptions = () => {
    let fixedOptions = {
      noData: {
        text: "ไม่พบข้อมูล",
        align: 'center',
        verticalAlign: 'middle',
        offsetX: 0,
        offsetY: 0,
        style: {
          color: undefined,
          fontSize: '14px',
          fontFamily: 'Kanit, system-ui'
        }
      }
    }

    switch (pattern) {
      case "stackedColumn":
        fixedOptions = {
          ...fixedOptions,
          chart: {
            type: 'bar',
            height: 350,
            stacked: true,
          },
          responsive: [{
            breakpoint: 480,
            options: {
              legend: {
                position: 'bottom',
                offsetX: -10,
                offsetY: 0
              }
            }
          }],
          dataLabels: {
            formatter: (value) => {
              return numeral(value).format('0,0[.]00');
            }
          },
          yaxis: {
            labels: {
              formatter: function (value) {
                return numeral(value).format('0,0[.]00');
              },
            },
          },
          plotOptions: {
            bar: {
              horizontal: false,
              borderRadius: 10,
            },
          },
          legend: {
            position: 'right',
          },
          fill: {
            opacity: 1
          }
        }
        return { ...options, ...fixedOptions }
      case "column":
        fixedOptions = {
          ...fixedOptions,
          chart: {
            type: 'bar',
            height: 350,
            stacked: true,
          },
          responsive: [{
            breakpoint: 480,
            options: {
              legend: {
                position: 'bottom',
                offsetX: -10,
                offsetY: 0
              }
            }
          }],
          dataLabels: {
            formatter: (value) => {
              return numeral(value).format('0,0[.]00');
            }
          },
          yaxis: {
            labels: {
              formatter: function (value) {
                return numeral(value).format('0,0[.]00');
              },
            },
          },
          plotOptions: {
            bar: {
              horizontal: false,
              borderRadius: 10,
            },
          },
          legend: {
            position: 'right',
          },
          fill: {
            opacity: 1
          }
        }
        return { ...options, ...fixedOptions }
      default:
        return options
    }
  }
  return (
    <ReactApexChart type={type} options={getOptions()} series={series} height={height} />
  )
}
