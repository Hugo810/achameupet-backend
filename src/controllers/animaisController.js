const admin = require('../config/firebaseAdmin');
const { validateWithPhotos } = require('../utils/validators/animalValidator');
const ImageService = require('../services/imageService');

// Função auxiliar fora da classe
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const toRad = (x) => x * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

class AnimalController {
  async cadastrarAnimal(req, res) {
    try {
      const { error, value: validatedData } = validateWithPhotos(req.body, req.files || []);

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.details.map(d => d.message)
        });
      }

      let fotosUrls = [];
      if (req.files && req.files.length > 0) {
        const uploadResults = await Promise.allSettled(
          req.files.map(file => ImageService.uploadImage(file))
        );

        fotosUrls = uploadResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
      }

      const lat = parseFloat(validatedData.latitude);
      const lng = parseFloat(validatedData.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: 'Coordenadas inválidas'
        });
      }

      const animalData = {
        ...validatedData,
        fotos: fotosUrls,
        usuarioId: req.user.uid,
        usuarioInfo: {
          nome: req.user.nome || 'Anônimo',
          telefone: req.user.telefone || '',
          email: req.user.email || ''
        },
        localizacao: new admin.firestore.GeoPoint(lat, lng),
        dataPostagem: admin.firestore.FieldValue.serverTimestamp(),
        status: validatedData.status || 'Perdido',
        visualizacoes: 0,
        contatos: 0,
        ativo: true,
        metadata: {
          criadoEm: admin.firestore.FieldValue.serverTimestamp(),
          atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
        }
      };

      const docRef = await admin.firestore().collection('animais').add(animalData);

      res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...animalData,
          dataPostagem: new Date().toISOString(),
          localizacao: { latitude: lat, longitude: lng }
        }
      });

    } catch (error) {
      console.error('Erro no cadastro:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno no servidor'
      });
    }
  }

  async buscarAnimaisProximos(req, res) {
    try {
      const { latitude, longitude, raio = 10, limite = 20 } = req.query;

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radius = parseFloat(raio);
      const limit = parseInt(limite);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: 'Latitude ou Longitude inválidos'
        });
      }

      const latDelta = radius / 111.12;
      const lngDelta = radius / (111.12 * Math.cos(lat * Math.PI / 180));

      const animaisRef = admin.firestore().collection('animais');
      const snapshot = await animaisRef
        .where('status', '==', 'Perdido')
        .where('ativo', '==', true)
        .where('localizacao', '>=', new admin.firestore.GeoPoint(lat - latDelta, lng - lngDelta))
        .where('localizacao', '<=', new admin.firestore.GeoPoint(lat + latDelta, lng + lngDelta))
        .limit(limit)
        .get();

      const animais = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.localizacao) continue;

        const distancia = calcularDistancia(
          lat, lng,
          data.localizacao.latitude,
          data.localizacao.longitude
        );

        animais.push({
          id: doc.id,
          ...data,
          distancia: distancia.toFixed(1),
          dataPostagem: data.dataPostagem?.toDate()?.toISOString()
        });
      }

      animais.sort((a, b) => parseFloat(a.distancia) - parseFloat(b.distancia));

      return res.status(200).json({
        success: true,
        data: animais,
        meta: {
          total: animais.length,
          raio: radius,
          localizacao: { latitude: lat, longitude: lng }
        }
      });

    } catch (error) {
      console.error('Erro ao buscar animais:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar animais',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message
        })
      });
    }
  }

  async buscarAnimalPorId(req, res) {
    try {
      const { id } = req.params;

      const docRef = admin.firestore().collection('animais').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Animal não encontrado'
        });
      }

      const data = doc.data();

      return res.status(200).json({
        success: true,
        data: {
          id: doc.id,
          ...data,
          dataPostagem: data.dataPostagem?.toDate()?.toISOString()
        }
      });

    } catch (error) {
      console.error('Erro ao buscar animal por ID:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar animal por ID'
      });
    }
  }

  async atualizarAnimal(req, res) {
    try {
      const { id } = req.params;

      const { error, value: validatedData } = validateWithPhotos(req.body, req.files || []);
      if (error) {
        return res.status(400).json({
          success: false,
          error: error.details.map(d => d.message)
        });
      }

      let fotosUrls = [];
      if (req.files && req.files.length > 0) {
        const uploadResults = await Promise.allSettled(
          req.files.map(file => ImageService.uploadImage(file))
        );

        fotosUrls = uploadResults
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
      }

      const lat = parseFloat(validatedData.latitude);
      const lng = parseFloat(validatedData.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({
          success: false,
          error: 'Coordenadas inválidas'
        });
      }

      const updateData = {
        ...validatedData,
        ...(fotosUrls.length > 0 && { fotos: fotosUrls }),
        localizacao: new admin.firestore.GeoPoint(lat, lng),
        'metadata.atualizadoEm': admin.firestore.FieldValue.serverTimestamp()
      };

      await admin.firestore().collection('animais').doc(id).update(updateData);

      return res.status(200).json({
        success: true,
        message: 'Animal atualizado com sucesso',
        data: { id, ...updateData }
      });

    } catch (error) {
      console.error('Erro ao atualizar animal:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno ao atualizar animal'
      });
    }
  }

  async removerAnimal(req, res) {
    try {
      const { id } = req.params;
      const docRef = admin.firestore().collection('animais').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Animal não encontrado'
        });
      }

      await docRef.delete();

      return res.status(200).json({
        success: true,
        message: 'Animal removido com sucesso'
      });
    } catch (error) {
      console.error('Erro ao remover animal:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao remover animal'
      });
    }
  }
}

module.exports = new AnimalController();
