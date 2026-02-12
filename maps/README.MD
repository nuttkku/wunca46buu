# Maps Development

[WUNCA 46 Presentation](WUNCA46.pdf)

![cover](cover.jpg)

| Resource | Link |
| --- | --- |
| Sign In Vallaris | [https://app.vallarismaps.com/management/signin](https://app.vallarismaps.com/management/signin) |
| GeoJSON io | [https://geojson.io/](https://geojson.io/) |
| Map Embed | [Map Embed](https://app.vallarismaps.com/management/visual/embed/668d1a3322614bee2b01f751?api_key=DTWny2GDbkFpzro5BkqVdE94rMNSLNcgDzgLb6F618Qd2wvLgC7R9o7oauwgRhHe&q=99.0984071549326,12.91247526387015&z=5.8977567150608445&p=0&b=0) |
| Datas and Manual | [Datas]([Datas](https://drive.google.com/drive/u/2/folders/1e6hAVnYCcPwOsxKO8FW5zExHx1V8-RdU)) |

## Node-RED Installation with Docker

To install and run Node-RED using Docker, use the following command:

```bash
docker run -it -p 1880:1880 -v node_red_data:/data --name wunca-nodered nodered/node-red
```

This command will:
- Run Node-RED in interactive mode (`-it`)
- Map port 1880 from the container to your host (`-p 1880:1880`)
- Create a persistent volume for Node-RED data (`-v node_red_data:/data`)
- Name the container `wunca-nodered` (`--name wunca-nodered`)

After running this command, you can access Node-RED at `http://localhost:1880`

## Node-RED Demo

Try the Node-RED GeoJSON demo live at:

- [https://wunca.vallaris.space/](https://wunca.vallaris.space/)


