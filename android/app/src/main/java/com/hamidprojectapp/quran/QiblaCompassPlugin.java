package com.hamidprojectapp.quran;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.GeomagneticField;
import android.view.Surface;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "QiblaCompass")
public class QiblaCompassPlugin extends Plugin implements SensorEventListener {
    private SensorManager sensorManager;
    private Sensor rotationSensor;

    @Override
    public void load() {
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
            if (rotationSensor == null) {
                rotationSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ORIENTATION);
            }
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (sensorManager == null || rotationSensor == null) {
            call.reject("Sensor kompas tidak tersedia pada perangkat ini.");
            return;
        }
        sensorManager.registerListener(this, rotationSensor, SensorManager.SENSOR_DELAY_UI);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        if (sensorManager != null) sensorManager.unregisterListener(this);
        call.resolve();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float azimuth;
        if (event.sensor.getType() == Sensor.TYPE_ROTATION_VECTOR) {
            float[] rotation = new float[9];
            float[] orientation = new float[3];
            SensorManager.getRotationMatrixFromVector(rotation, event.values);
            int rotationDisplay = getActivity().getWindowManager().getDefaultDisplay().getRotation();
            int axisX = SensorManager.AXIS_X;
            int axisY = SensorManager.AXIS_Y;
            if (rotationDisplay == Surface.ROTATION_90) {
                axisX = SensorManager.AXIS_Y;
                axisY = SensorManager.AXIS_MINUS_X;
            } else if (rotationDisplay == Surface.ROTATION_180) {
                axisX = SensorManager.AXIS_MINUS_X;
                axisY = SensorManager.AXIS_MINUS_Y;
            } else if (rotationDisplay == Surface.ROTATION_270) {
                axisX = SensorManager.AXIS_MINUS_Y;
                axisY = SensorManager.AXIS_X;
            }
            float[] adjusted = new float[9];
            SensorManager.remapCoordinateSystem(rotation, axisX, axisY, adjusted);
            SensorManager.getOrientation(adjusted, orientation);
            azimuth = (float) Math.toDegrees(orientation[0]);
        } else {
            azimuth = event.values[0];
        }
        float heading = (azimuth + 360f) % 360f;
        JSObject data = new JSObject();
        data.put("heading", heading);
        notifyListeners("heading", data);
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        JSObject data = new JSObject();
        data.put("accuracy", accuracy);
        notifyListeners("accuracy", data);
    }
}
