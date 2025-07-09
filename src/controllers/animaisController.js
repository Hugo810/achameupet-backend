const admin = require('../config/firebaseAdmin');
const animalValidator = require('../utils/validators/animalValidator');
const ImageService = require('../services/imageService');

class AnimalController {
  async cadastrarAnimal(req, res) {
    try {
      // Validação dos dados
      const { error } = animalValidator.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          success: false,
          error: error.details.map(detail => detail.message) // Mostra todos os erros
        });
      }

      // Verifica se há arquivos para upload
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Pelo menos uma foto é necessária'
        });
      }

      // Upload de imagens com tratamento de erros individual
      const fotosUrls = [];
      for (const file of req.files) {
        try {
          const url = await ImageService.uploadImage(file);
          fotosUrls.push(url);
        } catch (uploadError) {
          console.error(`Erro no upload da imagem ${file.originalname}:`, uploadError);
          // Continua com as outras imagens mesmo se uma falhar
        }
      }

      if (fotosUrls.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhuma imagem foi enviada com sucesso'
        });
      }

      const animalData = {
        ...req.body,
        fotos: fotosUrls,
        usuarioId: req.user.uid,
        usuarioInfo: { // Armazena informações básicas do usuário
          nome: req.user.nome || 'Anônimo',
          telefone: req.user.whatsapp || ''
        },
        localizacao: new admin.firestore.GeoPoint(
          parseFloat(req.body.latitude),
          parseFloat(req.body.longitude)
        ),
        dataPostagem: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Perdido',
        visualizacoes: 0,
        contatos: 0,
        ativo: true
      };

      const docRef = await admin.firestore().collection('animais').add(animalData);
      
      return res.status(201).json({ 
        success: true,
        data: { 
          id: docRef.id,
          ...animalData,
          dataPostagem: new Date().toISOString() // Para retorno imediato
        }
      });

    } catch (error) {
      console.error('Erro ao cadastrar animal:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erro interno no servidor',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error.message,
          stack: error.stack 
        })
      });
    }
  }

  async buscarAnimaisProximos(req, res) {
    try {
      const { latitude, longitude, raio = 10, limite = 20 } = req.query;
      
      // Validação básica dos parâmetros
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Coordenadas de localização são obrigatórias'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radius = parseFloat(raio);
      const limit = parseInt(limite);

      // Conversão de km para graus (aproximada)
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

      const animais = snapshot.docs.map(doc => {
        const data = doc.data();
        // Calcula distância aproximada
        const distancia = this.calcularDistancia(
          lat, lng, 
          data.localizacao.latitude, 
          data.localizacao.longitude
        );
        
        return {
          id: doc.id,
          ...data,
          distancia: distancia.toFixed(1),
          dataPostagem: data.dataPostagem?.toDate()?.toISOString()
        };
      });

      // Ordena por mais próximo
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

  // Método auxiliar para cálculo de distância (Haversine)
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  async buscarAnimalPorId(req, res) {
  try {
    const { id } = req.params;
    
    const doc = await admin.firestore().collection('animais').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false,
        error: 'Animal não encontrado' 
      });
    }

    // Incrementa visualizações
    await admin.firestore().collection('animais').doc(id).update({
      visualizacoes: admin.firestore.FieldValue.increment(1)
    });

    res.status(200).json({
      success: true,
      data: { id: doc.id, ...doc.data() }
    });

  } catch (error) {
    console.error('Erro ao buscar animal:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar animal'
    });
  }
}
}

module.exports = new AnimalController();